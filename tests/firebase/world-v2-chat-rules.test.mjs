import {before,after,beforeEach,test} from "node:test";
import {readFileSync} from "node:fs";
import {strict as assert} from "node:assert";
import {
  initializeTestEnvironment,assertSucceeds,assertFails
} from "@firebase/rules-unit-testing";
import {doc,collection,getDoc,getDocs,setDoc,updateDoc,deleteDoc,serverTimestamp} from "firebase/firestore";

if(!/^(127\.0\.0\.1|localhost):[0-9]+$/.test(process.env.FIRESTORE_EMULATOR_HOST||"")){
  throw new Error("World V2 chat Rules tests require local Emulator");
}
const CID="fixture-couple",A="fixture-alice",B="fixture-bob",EVIL="fixture-outsider";
let env;
const cli=uid=>uid?env.authenticatedContext(uid).firestore():env.unauthenticatedContext().firestore();
const chats=db=>collection(db,"couples",CID,"worldChat");
const target=(db,id)=>doc(db,"couples",CID,"worldChat",id);
const msg=(who,authorUid,text="Xin chào người thương!",scope="bep")=>({
  who,authorUid,text,scope,at:serverTimestamp()
});

before(async()=>{
  const [host,portText]=process.env.FIRESTORE_EMULATOR_HOST.split(":");
  env=await initializeTestEnvironment({
    projectId:"demo-goc-nho-safety",
    firestore:{host,port:Number(portText),rules:readFileSync("tests/firebase/fixtures/world-v2-chat.rules","utf8")}
  });
});
after(async()=>{if(env)await env.cleanup();});
beforeEach(async()=>{
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async(ctx)=>{
    await setDoc(doc(ctx.firestore(),"couples",CID),{
      members:[A,B],roles:{[A]:0,[B]:1},code:"TEST-ONLY"
    });
    await setDoc(doc(ctx.firestore(),"couples",CID,"notes","legacy"),{body:"old content"});
  });
});

test("only two members can send and both can read the same chat stream",async()=>{
  const a=cli(A),b=cli(B);
  await assertSucceeds(setDoc(target(a,"mA"),msg(0,A)));
  await assertSucceeds(setDoc(target(b,"mB"),msg(1,B,"Chào lại!","phong-khach")));
  const aMessage=(await assertSucceeds(getDoc(target(b,"mA")))).data();
  assert.equal(aMessage.text,"Xin chào người thương!");
  assert.equal(aMessage.authorUid,A);
  const history=await assertSucceeds(getDocs(chats(a)));
  assert.equal(history.docs.length,2);
});

test("outsider and unauthenticated user cannot read/write chat",async()=>{
  const a=cli(A);
  await assertSucceeds(setDoc(target(a,"exists"),msg(0,A)));
  for(const uid of [EVIL,null]){
    const db=cli(uid);
    await assertFails(getDoc(target(db,"exists")));
    await assertFails(getDocs(chats(db)));
    await assertFails(setDoc(target(db,"fake"),msg(0,uid||"anonymous")));
  }
});

test("members cannot impersonate another role or UID",async()=>{
  const a=cli(A);
  await assertFails(setDoc(target(a,"wrong-uid"),msg(0,B)));
  await assertFails(setDoc(target(a,"wrong-role"),msg(1,A)));
  await assertFails(setDoc(target(a,"wrong-both"),msg(1,B)));
});

test("messages are immutable and capped in size and room scope",async()=>{
  const a=cli(A),b=cli(B);
  await assertSucceeds(setDoc(target(a,"ok"),msg(0,A)));
  await assertFails(updateDoc(target(b,"ok"),{text:"fake edit"}));
  await assertFails(deleteDoc(target(a,"ok")));
  await assertFails(setDoc(target(a,"ok"),msg(0,A,"replaced")));
  await assertFails(setDoc(target(a,"large"),msg(0,A,"x".repeat(281))));
  await assertFails(setDoc(target(a,"empty"),msg(0,A,"")));
  await assertFails(setDoc(target(a,"badroom"),msg(0,A,"Hi","outside")));
  await assertFails(setDoc(target(a,"extra"),{...msg(0,A),admin:true}));
  await assertFails(setDoc(target(a,"untrusted-time"),{
    who:0,authorUid:A,text:"Hi",scope:"bep",at:new Date("2024-01-01")
  }));
});

test("protected chat is excluded from broad legacy allow, while legacy data remains usable",async()=>{
  const a=cli(A),b=cli(B);
  await assertFails(setDoc(target(a,"forged"),{who:1,authorUid:B,text:"fake",scope:"bep",at:serverTimestamp()}));
  await assertSucceeds(updateDoc(doc(a,"couples",CID,"notes","legacy"),{body:"still safe"}));
  const legacy=(await assertSucceeds(getDoc(doc(b,"couples",CID,"notes","legacy")))).data();
  assert.equal(legacy.body,"still safe");
});
