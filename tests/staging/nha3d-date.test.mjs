import test from "node:test";
import assert from "node:assert/strict";
import * as A from "../../nha3d/date-activities.mjs";
import * as W from "../../nha3d/world.mjs";
import * as E from "../../nha3d/engine.mjs";
import {CATALOG} from "../../nha3d/catalog.mjs";
import {readPresence} from "../../nha3d/sync.mjs";
let n=0;
const cmd=(action,uid="alice",value,extra={})=>({kind:"cook",action,uid,who:uid==="alice"?"anh":"em",nonce:"n"+(++n),now:100000,value,...extra});
const step=(s,action,uid,value,extra={})=>A.advanceActivity(s,cmd(action,uid,value,{expectedRev:s?.rev||0,...extra}));
test("cooperative drink requires alternating authenticated identities, not just changing avatar",()=>{
 let s=step(null,"start","alice",undefined,{recipe:"dau"});s=step(s,"ingredient","alice","dau");
 assert.throws(()=>step(s,"ingredient","alice","sua",{who:"em"}),/lượt người kia/);
 const before=JSON.stringify(s);assert.throws(()=>step(s,"ingredient","bob","muoi"),/nguyên liệu/);assert.equal(JSON.stringify(s),before);
 s=step(s,"ingredient","bob","sua");s=step(s,"mix","alice",A.beatTarget("dau",2));s=step(s,"mix","bob",A.beatTarget("dau",3));
 assert.equal(s.phase,"done");assert.equal(s.stars,3);assert.equal(s.album.dau,3);assert.equal(new Set(s.steps.map(x=>x.uid)).size,2);
 const replay=step(s,"start","alice",undefined,{recipe:"dao"});assert.equal(replay.album.dau,3);assert.equal(replay.steps.length,0);
});
test("revision conflicts and duplicate clicks never erase a partner turn",()=>{
 const start=cmd("start","alice",undefined,{recipe:"cam",expectedRev:0});const s=A.advanceActivity(null,start);
 assert.deepEqual(A.advanceActivity(s,start),s);
 assert.throws(()=>A.advanceActivity(s,{...start,nonce:"other"}),/vừa thao tác/);
 assert.throws(()=>step(s,"start","bob",undefined,{recipe:"dau"}),/đang làm/);
 const next=step(s,"ingredient","bob","cam");assert.throws(()=>A.advanceActivity(next,cmd("ingredient","alice","mat",{expectedRev:s.rev})),/vừa thao tác/);
});
test("an abandoned session can restart after ten minutes; unsupported documents are never overwritten",()=>{
 const s=step(null,"start","alice",undefined,{recipe:"dau"});
 assert.throws(()=>step(s,"ingredient","bob","dau",{now:700001}),/nghỉ quá lâu/);
 const r=step(s,"start","bob",undefined,{recipe:"chanh",now:700001});assert.equal(r.recipe,"chanh");
 assert.throws(()=>A.advanceActivity({v:999},cmd("start","alice",null,{recipe:"dau"})),/không ghi đè/);
});
test("fishing early, timely and late have different results; replay cannot duplicate catches",()=>{
 const cast=(nonce)=>A.advanceActivity(null,{kind:"fish",action:"cast",uid:"alice",who:"anh",nonce,now:1000,expectedRev:0});
 const s=cast("cast1");assert.equal(A.fishPhase(s,s.biteAt-1),"waiting");assert.equal(A.fishPhase(s,s.biteAt),"bite");assert.equal(A.fishPhase(s,s.until+1),"escaped");
 const reel={kind:"fish",action:"reel",uid:"alice",who:"anh",nonce:"reel",now:s.biteAt+850,expectedRev:s.rev};
 const caught=A.advanceActivity(s,reel);assert.equal(caught.total,1);assert.equal(caught.catch.precise,true);
 assert.deepEqual(A.advanceActivity(caught,reel),caught);
 assert.equal(A.advanceActivity(s,{...reel,nonce:"early",now:s.biteAt-1}).phase,"escaped");
 assert.equal(A.advanceActivity(s,{...reel,nonce:"late",now:s.until+1}).phase,"escaped");
 assert.throws(()=>A.advanceActivity(s,{...reel,uid:"bob"}),/người kia/);
 assert.throws(()=>A.advanceActivity(s,{...reel,action:"cast"}),/Phao còn/);
});
test("fixed date island has valid furniture and every activity reachable; presence supports the new scene",()=>{
 const {layout,dropped}=E.sanitizeLayout(E.clone(W.DATE_LAYOUT),W.DATE_ISLAND);assert.deepEqual(dropped,[]);
 const g=E.blockGrid(layout,W.DATE_ISLAND);
 for(const it of layout.items){if(!CATALOG[it.type].use)continue;const p=E.approachPoint(g,it,null,W.DATE_ISLAND);assert.ok(p,it.uid);assert.ok(E.worldPath(g,W.DATE_SPAWN.x,W.DATE_SPAWN.z,p.x,p.z,W.DATE_ISLAND),it.uid);}
 assert.equal(W.crossesDoor("hen",0,4,0,1),false);
 assert.ok(readPresence({k:"presence",who:"anh",scene:"hen",x:0,z:1,at:1000},1000).fresh);
 assert.equal(readPresence({k:"presence",who:"anh",scene:"unknown",x:0,z:1,at:1000},1000),null);
});
