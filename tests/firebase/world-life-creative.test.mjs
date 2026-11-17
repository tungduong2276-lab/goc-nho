import {before,after,beforeEach,test} from "node:test";
import {readFileSync} from "node:fs";
import {strict as assert} from "node:assert";
import {initializeTestEnvironment,assertSucceeds,assertFails} from "@firebase/rules-unit-testing";
import {doc,getDoc,setDoc,runTransaction,serverTimestamp} from "firebase/firestore";
import {applyLife} from "../../nha3d/life.mjs";
import {newPlant,water,HOUR,status as cropStatus} from "../../nha3d/garden.mjs";
import {encodeItem,decodeItem} from "../../nha3d/sync.mjs";
import {cleanStrokes,canPublishPainting,combinePainting} from "../../nha3d/creative.mjs";

if(!/^(127\.0\.0\.1|localhost):[0-9]+$/.test(process.env.FIRESTORE_EMULATOR_HOST||""))
  throw new Error("Life/creative tests require a loopback Firestore Emulator; production is forbidden");
const projectId="demo-goc-nho-safety",cid="fixture-couple";
const alice="fixture-alice",bob="fixture-bob",eve="fixture-outsider";
let env;
const db=uid=>(uid?env.authenticatedContext(uid):env.unauthenticatedContext()).firestore();
const ref=(uid,id)=>doc(db(uid),`couples/${cid}/world/${id}`);
before(async()=>{
  const [host,port]=process.env.FIRESTORE_EMULATOR_HOST.split(":");
  env=await initializeTestEnvironment({projectId,firestore:{host,port:+port,rules:readFileSync("firestore.rules","utf8")}});
});
after(async()=>env?.cleanup());
beforeEach(async()=>{
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx=>{
    await setDoc(doc(ctx.firestore(),`couples/${cid}`),{members:[alice,bob],code:"FIXTURE",roles:{[alice]:0,[bob]:1}});
  });
});

test("shared pantry & creative docs remain private to the two members",async()=>{
  const path="l_home",creative="cc_art_demo";
  await assertSucceeds(setDoc(ref(alice,path),{k:"life",state:{v:1,stock:{xalach:2}},ts:serverTimestamp()}));
  await assertSucceeds(getDoc(ref(bob,path)));
  await assertFails(getDoc(ref(eve,path)));
  await assertFails(setDoc(ref(eve,path),{k:"life"}));
  await assertFails(getDoc(ref(null,path)));
  await assertSucceeds(setDoc(ref(bob,creative),{k:"creative-art",id:"demo",title:"Hai người",strokes:[]}));
  assert.equal((await getDoc(ref(alice,creative))).data().title,"Hai người");
  await assertFails(getDoc(ref(eve,creative)));
});

test("two phones cannot harvest the same ripe bed twice: crop + stock are one transaction",async()=>{
  const T=Date.UTC(2026,10,17,8);
  const plant=water(water(newPlant("cachua","anh",T-48*HOUR),"anh",T-48*HOUR),"em",T-24*HOUR);
  assert.equal(cropStatus(plant,T).ripe,true);
  const bed={uid:"bed1",type:"luongTrong",gx:3,gz:5,r:0,plant};
  await setDoc(ref(alice,"i_san_bed1"),encodeItem("san",bed));
  const run=(uid,who)=>{
    const client=db(uid), at=id=>doc(client,`couples/${cid}/world/${id}`);
    return runTransaction(client,async tx=>{
    const crop=at("i_san_bed1"),life=at("l_home");
    const [a,b]=await Promise.all([tx.get(crop),tx.get(life)]);
    if(!a.exists())return false;
    const item=decodeItem(a.data()),cropState=item?.plant&&cropStatus(item.plant,T);
    if(!cropState?.ripe)return false;
    const res=applyLife(b.exists()?b.data().state:null,{type:"harvest",sp:"cachua",amount:3},who,T);
    if(!res.ok)return false;
    tx.set(crop,encodeItem("san",{...item,plant:undefined},true));
    tx.set(life,{k:"life",state:res.next,ts:serverTimestamp()});
    return true;
    });
  };
  const results=await Promise.all([run(alice,"anh"),run(bob,"em")]);
  assert.deepEqual(results.sort(),[false,true]);
  assert.equal((await getDoc(ref(alice,"l_home"))).data().state.stock.cachua,5);
  assert.equal(decodeItem((await getDoc(ref(bob,"i_san_bed1"))).data()).plant,undefined);
});

test("two authors append to the same story without losing either paragraph",async()=>{
  await setDoc(ref(alice,"cc_story_meta"),{id:"story1",k:"creative-meta",title:"Miu",kind:"story",lines:[]});
  const write=(uid,who,text)=>{
    const client=db(uid),d=doc(client,`couples/${cid}/world/cc_story_meta`);
    return runTransaction(client,async tx=>{
    const snap=await tx.get(d);
    const lines=snap.data().lines;
    tx.update(d,{lines:[...lines,{by:who,text,at:Date.now()}]});
    });
  };
  await Promise.all([write(alice,"anh","Một hôm..."),write(bob,"em","Trời mưa.")]);
  const lines=(await getDoc(ref(alice,"cc_story_meta"))).data().lines;
  assert.equal(lines.length,2);
  assert.deepEqual(new Set(lines.map(x=>x.by)),new Set(["anh","em"]));
});

test("painting contributions use separate docs, publish both strokes without altering old drawings",async()=>{
  const stroke=who=>({id:"s"+who,by:who,at:Date.now(),color:"#1D2B4F",width:5,points:[{x:.1,y:.2},{x:.5,y:.5}]});
  await Promise.all([
    setDoc(ref(alice,"cc_paint_anh"),{session:"demo",strokes:[stroke("anh")]}),
    setDoc(ref(bob,"cc_paint_em"),{session:"demo",strokes:[stroke("em")]})
  ]);
  const [a,b]=await Promise.all([getDoc(ref(bob,"cc_paint_anh")),getDoc(ref(alice,"cc_paint_em"))]);
  assert.equal(canPublishPainting(a.data().strokes,b.data().strokes),true);
  const painting=combinePainting(cleanStrokes(a.data().strokes),cleanStrokes(b.data().strokes));
  await assertSucceeds(setDoc(ref(alice,"cc_art_demo"),{k:"creative-art",id:"demo",strokes:painting,title:"Nhà chung"}));
  assert.equal((await getDoc(ref(bob,"cc_art_demo"))).data().strokes.length,2);
});
