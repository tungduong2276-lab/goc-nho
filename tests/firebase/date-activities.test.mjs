import {before,after,beforeEach,test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {initializeTestEnvironment,assertFails} from "@firebase/rules-unit-testing";
import {doc,setDoc,getDoc,runTransaction} from "firebase/firestore";
import * as A from "../../nha3d/date-activities.mjs";
if(!/^(127\.0\.0\.1|localhost):[0-9]+$/.test(process.env.FIRESTORE_EMULATOR_HOST||""))throw Error("Loopback Emulator only");
let env,n=0;const CID="date-fixture",ALICE="date-alice",BOB="date-bob",EVE="date-outsider";
const fsOf=uid=>(uid?env.authenticatedContext(uid):env.unauthenticatedContext()).firestore();
const ref=(uid,id,cid=CID)=>doc(fsOf(uid),"couples/"+cid+"/world/"+id);
before(async()=>{const[host,port]=process.env.FIRESTORE_EMULATOR_HOST.split(":");env=await initializeTestEnvironment({projectId:"demo-goc-nho-safety",firestore:{host,port:Number(port),rules:readFileSync("firestore.rules","utf8")}});});
after(async()=>env?.cleanup());
beforeEach(async()=>{await env.clearFirestore();await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),"couples/"+CID),{members:[ALICE,BOB]});});});
async function act(uid,command){
 const f=fsOf(uid),r=doc(f,"couples/"+CID+"/world/"+A.dateDocId(command.kind,uid));
 return runTransaction(f,async tx=>{const snap=await tx.get(r),next=A.advanceActivity(snap.exists()?snap.data():null,{...command,uid,nonce:command.nonce||"e"+(++n),now:100000});tx.set(r,next);return next;});
}
test("real two-client transactions alternate roles and preserve a shared completed recipe",async()=>{
 let s=await act(ALICE,{kind:"cook",action:"start",who:"anh",recipe:"dau",expectedRev:0});
 s=await act(ALICE,{kind:"cook",action:"ingredient",who:"anh",value:"dau",expectedRev:s.rev});
 await assert.rejects(act(ALICE,{kind:"cook",action:"ingredient",who:"em",value:"sua",expectedRev:s.rev}),/lượt người kia/);
 s=await act(BOB,{kind:"cook",action:"ingredient",who:"em",value:"sua",expectedRev:s.rev});
 s=await act(ALICE,{kind:"cook",action:"mix",who:"anh",value:A.beatTarget("dau",2),expectedRev:s.rev});
 s=await act(BOB,{kind:"cook",action:"mix",who:"em",value:A.beatTarget("dau",3),expectedRev:s.rev});
 assert.equal(s.phase,"done");assert.equal(s.stars,3);
 assert.deepEqual((await getDoc(ref(ALICE,"a_date_cook"))).data(),(await getDoc(ref(BOB,"a_date_cook"))).data());
});
test("simultaneous starts resolve to one session without last-write-wins loss",async()=>{
 const results=await Promise.allSettled([
 act(ALICE,{kind:"cook",action:"start",who:"anh",recipe:"dau",expectedRev:0}),
 act(BOB,{kind:"cook",action:"start",who:"em",recipe:"dao",expectedRev:0})
 ]);
 assert.equal(results.filter(r=>r.status==="fulfilled").length,1);
 const saved=(await getDoc(ref(ALICE,"a_date_cook"))).data();assert.equal(saved.rev,1);assert.equal(saved.phase,"making");
});
test("activities are scoped to couple membership; signed-out and cross-couple reads/writes denied",async()=>{
 const s=await act(ALICE,{kind:"fish",action:"cast",who:"anh",expectedRev:0});
 const id=A.dateDocId("fish",ALICE);assert.equal((await getDoc(ref(BOB,id))).data().owner,ALICE);
 for(const u of [EVE,null]){await assertFails(getDoc(ref(u,id)));await assertFails(setDoc(ref(u,"a_date_cook"),s));}
 await assertFails(getDoc(ref(ALICE,id,"another-couple")));
});
