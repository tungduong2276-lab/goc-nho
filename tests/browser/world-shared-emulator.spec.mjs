// End-to-end two-browser Firebase Emulator verification for new collaborative work.
// NO production project, Google backend, staging project, or user account is accessed.
import {test,expect} from "@playwright/test";
import {existsSync,readFileSync} from "node:fs";
import {resolve} from "node:path";
import {initializeTestEnvironment} from "@firebase/rules-unit-testing";
import {doc,setDoc} from "firebase/firestore";
const firestoreHost=process.env.FIRESTORE_EMULATOR_HOST||"";
const authHost=process.env.FIREBASE_AUTH_EMULATOR_HOST||"";
const safe=/^(127\.0\.0\.1|localhost):\d+$/;
const enabled=safe.test(firestoreHost)&&safe.test(authHost);
if(process.env.WORLD_SHARED_EMULATOR_REQUIRED==="1"&&!enabled)
  throw Error("WORLD_SHARED_EMULATOR_REQUIRED: local Firestore/Auth Emulators are mandatory");
test.skip(!enabled,"Requires isolated local Firestore and Auth Emulators");
test.describe.configure({timeout:120000});

const PROJECT="demo-goc-nho-safety",CID="fixture-world-shared";
const bundle=name=>{
 const path=resolve("node_modules/firebase","firebase-"+name+"-compat.js");
 if(!existsSync(path))throw Error("Missing compat Firebase SDK "+name);
 return path;
};
async function connect(browser,name){
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:"block"});
 const unexpected=[],blocked=[];
 await context.route("**/*",route=>{
   const url=new URL(route.request().url);
   const isLoop=["localhost","127.0.0.1"].includes(url.hostname)&&[4173,Number(firestoreHost.split(":")[1]),Number(authHost.split(":")[1])].includes(Number(url.port));
   if(isLoop)return route.continue();
   blocked.push(url.hostname);
   if(url.hostname==="www.google.com")return route.fulfill({status:204,body:""});
   unexpected.push("Blocked outbound request: "+url.hostname);
   return route.abort("blockedbyclient");
 });
 const page=await context.newPage();
 page.on("pageerror",error=>unexpected.push(error.message));
 await page.goto("/tests/browser/fixtures/nha3d-firestore-emulator.html");
 for(const part of ["app","auth","firestore"])await page.addScriptTag({path:bundle(part)});
 const uid=await page.evaluate(async({name,firestoreHost,authHost,projectId})=>{
   const app=window.firebase.initializeApp({
     projectId,apiKey:"local-emulator-only",authDomain:"localhost",appId:"1:123:web:local-only"
   },"shared-"+name);
   const auth=app.auth();auth.useEmulator("http://"+authHost);
   const db=app.firestore();db.useEmulator(...[firestoreHost.split(":")[0],+firestoreHost.split(":")[1]]);
   const credential=await auth.signInAnonymously();
   window.lab={app,db,uid:credential.user.uid,seen:{},errors:[],unsubs:[]};
   return credential.user.uid;
 },{name,firestoreHost,authHost,projectId:PROJECT});
 return {context,page,uid,unexpected,blocked};
}
async function subscribe(page,id){
 await page.evaluate(({cid,id})=>{
   const lab=window.lab;
   lab.seen[id]=[];
   const off=lab.db.doc("couples/"+cid+"/world/"+id).onSnapshot({includeMetadataChanges:true},snapshot=>{
     if(!snapshot.metadata.hasPendingWrites)lab.seen[id].push(snapshot.exists?snapshot.data():null);
   },error=>lab.errors.push(error.code));
   lab.unsubs.push(off);
 },{cid:CID,id});
}
const last=(page,id)=>page.evaluate(id=>window.lab.seen[id]?.at(-1)||null,id);
async function set(page,id,value){
 await page.evaluate(async({cid,id,value})=>{
   await window.lab.db.doc("couples/"+cid+"/world/"+id).set(value);
 },{cid:CID,id,value});
}
test("two isolated phones live-sync strokes, co-writing, offline catch-up; outsider denied",async({browser})=>{
 let env;const clients=[];
 try{
   env=await initializeTestEnvironment({
     projectId:PROJECT,firestore:{
       host:firestoreHost.split(":")[0],port:+firestoreHost.split(":")[1],
       rules:readFileSync("firestore.rules","utf8")
     }
   });
   await env.clearFirestore();
   const alice=await connect(browser,"alice");clients.push(alice);
   const bob=await connect(browser,"bob");clients.push(bob);
   expect(alice.uid).not.toBe(bob.uid);
   await env.withSecurityRulesDisabled(async admin=>{
     await setDoc(doc(admin.firestore(),"couples/"+CID),{
       members:[alice.uid,bob.uid],roles:{[alice.uid]:0,[bob.uid]:1},code:"SYNTHETIC"
     });
   });
   // Both phones subscribe to the same creative documents, not separate local mocks.
   await subscribe(bob.page,"cc_paint_anh");
   await subscribe(alice.page,"cc_paint_em");
   await subscribe(bob.page,"cc_story_meta");
   await subscribe(alice.page,"cc_story_meta");
   await subscribe(bob.page,"cc_draft_anh");
   await expect.poll(()=>bob.page.evaluate(()=>window.lab.seen.cc_paint_anh.length),{timeout:10000}).toBeGreaterThan(0);

   await set(alice.page,"cc_paint_anh",{
     k:"creative-paint",session:"p1",who:"anh",
     strokes:[{id:"a1",by:"anh",at:10,color:"#1D2B4F",width:5,points:[{x:.1,y:.1},{x:.6,y:.8}]}]
   });
   await expect.poll(async()=>(await last(bob.page,"cc_paint_anh"))?.strokes?.[0]?.points?.[1]?.x,
     {timeout:15000}).toBe(.6);
   await set(bob.page,"cc_paint_em",{
     k:"creative-paint",session:"p1",who:"em",
     strokes:[{id:"b1",by:"em",at:11,color:"#ED78A3",width:5,points:[{x:.9,y:.3},{x:.4,y:.6}]}]
   });
   await expect.poll(async()=>(await last(alice.page,"cc_paint_em"))?.strokes?.[0]?.by,
     {timeout:15000}).toBe("em");

   // Concurrent transactions append to ONE story; neither user's paragraph may vanish.
   await set(alice.page,"cc_story_meta",{
     k:"creative-meta",kind:"story",id:"story1",title:"Hai đứa đi lạc",lines:[]
   });
   await expect.poll(async()=>Array.isArray((await last(bob.page,"cc_story_meta"))?.lines),
     {timeout:15000}).toBe(true);
   const add=(page,who,line)=>page.evaluate(async({cid,who,line})=>{
     const doc=window.lab.db.doc("couples/"+cid+"/world/cc_story_meta");
     await window.lab.db.runTransaction(async transaction=>{
       const snap=await transaction.get(doc);
       const lines=snap.data().lines||[];
       transaction.update(doc,{lines:[...lines,{by:who,text:line,at:Date.now()}]});
     });
   },{cid:CID,who,line});
   await Promise.all([add(alice.page,"anh","Con đường đầy sao."),add(bob.page,"em","Và một bé mèo.")]);
   await expect.poll(async()=>(await last(bob.page,"cc_story_meta"))?.lines?.length,
     {timeout:15000}).toBe(2);
   const lines=(await last(alice.page,"cc_story_meta")).lines;
   expect(new Set(lines.map(p=>p.by))).toEqual(new Set(["anh","em"]));

   // Bob's network is cut. Alice can still save a draft. Bob later catches up.
   await bob.context.setOffline(true);
   await expect.poll(()=>bob.page.evaluate(()=>navigator.onLine),{timeout:10000}).toBe(false);
   await set(alice.page,"cc_draft_anh",{k:"creative-draft",session:"story1",who:"anh",text:"Bí mật dưới giếng.",at:Date.now()});
   await bob.page.waitForTimeout(300);
   expect(await last(bob.page,"cc_draft_anh")).toBeNull();
   await bob.context.setOffline(false);
   await expect.poll(()=>bob.page.evaluate(()=>navigator.onLine),{timeout:10000}).toBe(true);
   await expect.poll(async()=>(await last(bob.page,"cc_draft_anh"))?.text,
     {timeout:15000}).toBe("Bí mật dưới giếng.");

   // A third signed-in user, even with a valid Firebase token, cannot read the home.
   const outsider=await connect(browser,"outsider");clients.push(outsider);
   await subscribe(outsider.page,"cc_paint_anh");
   await expect.poll(()=>outsider.page.evaluate(()=>window.lab.errors.includes("permission-denied")),
     {timeout:15000}).toBe(true);
   for(const client of clients){
     expect(client.unexpected).toEqual([]);
     expect(client.blocked.every(x=>x==="www.google.com")).toBe(true);
     if(client!==outsider)expect(await client.page.evaluate(()=>window.lab.errors)).toEqual([]);
   }
 }finally{
   for(const client of clients){
     if(!client.page.isClosed())await client.page.evaluate(()=>window.lab?.unsubs?.forEach(off=>off())).catch(()=>{});
     await client.context.close().catch(()=>{});
   }
   await env?.cleanup();
 }
});
