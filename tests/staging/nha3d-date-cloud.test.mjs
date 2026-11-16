import test from "node:test";
import assert from "node:assert/strict";
import {connectCloud} from "../../nha3d/cloud.js";
test("activity adapter binds Auth UID, captures click time before transaction latency and refuses offline dispatch",async t=>{
 const previousWindow=Object.getOwnPropertyDescriptor(globalThis,"window"),previousNavigator=Object.getOwnPropertyDescriptor(globalThis,"navigator");
 let clock=100000,transactions=0,writes=0;const docs=new Map(),nav={onLine:true};
 t.mock.timers.enable({apis:["setTimeout"]});t.mock.method(Date,"now",()=>clock);
 const fs={
  enablePersistence:async()=>{},
  doc:path=>({get:async()=>({exists:true,data:()=>({couple:"fixture"})})}),
  collection:()=>({doc:id=>({id})}),
  runTransaction:async fn=>{transactions++;return fn({
   get:async ref=>{clock+=10000;const data=docs.get(ref.id);return{exists:!!data,data:()=>data};},
   set:(ref,data)=>{writes++;docs.set(ref.id,data);}
  });}
 };
 Object.defineProperty(globalThis,"navigator",{value:nav,configurable:true});
 Object.defineProperty(globalThis,"window",{value:{FIREBASE_CONFIG:{apiKey:"fixture"},firebase:{
  apps:[{}],firestore:()=>fs,auth:()=>({onAuthStateChanged:cb=>{queueMicrotask(()=>cb({uid:"authenticated-alice"}));return()=>{};}})
 }},configurable:true});
 t.after(()=>{if(previousWindow)Object.defineProperty(globalThis,"window",previousWindow);else delete globalThis.window;if(previousNavigator)Object.defineProperty(globalThis,"navigator",previousNavigator);else delete globalThis.navigator;});
 const api=await connectCloud();assert.equal(api.ok,true);
 const cast=await api.actDate("fish",{action:"cast",uid:"forged-bob",who:"anh",nonce:"cast",expectedRev:0});
 assert.equal(cast.data.owner,"authenticated-alice");assert.ok(cast.data.biteAt<110000,"cast time precedes simulated network delay");
 clock=cast.data.biteAt+850;
 const caught=await api.actDate("fish",{action:"reel",who:"anh",nonce:"reel",expectedRev:cast.data.rev});
 assert.equal(caught.data.phase,"caught","round-trip latency must not turn a timely click into an escaped fish");
 assert.equal(caught.data.total,1);const before=writes;
 await api.actDate("fish",{action:"reel",who:"anh",nonce:"reel",expectedRev:cast.data.rev});assert.equal(writes,before,"idempotent retry does not write again");
 nav.onLine=false;const count=transactions;
 await assert.rejects(api.actDate("fish",{action:"cast",who:"anh",nonce:"offline",expectedRev:caught.data.rev}),/mất mạng/);
 assert.equal(transactions,count,"offline actions do not enter SDK transaction queue");
});
