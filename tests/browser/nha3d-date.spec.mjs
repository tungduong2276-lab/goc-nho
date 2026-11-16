import {test,expect} from "@playwright/test";
import {readFileSync,mkdirSync} from "node:fs";
import {resolve} from "node:path";
import * as A from "../../nha3d/date-activities.mjs";
test.describe.configure({timeout:180000});
async function open(page,width=390,scene="hen",who="anh"){
 await page.setViewportSize({width,height:844});const errors=[],requests=[];
 page.on("pageerror",e=>errors.push(e.message));
 page.on("request",r=>{if(/firestore\.googleapis|firebaseio|identitytoolkit|securetoken/.test(r.url()))requests.push(r.url());});
 for(const h of ["www.gstatic.com","fonts.googleapis.com","fonts.gstatic.com"])await page.route("https://"+h+"/**",r=>r.abort());
 await page.route("https://cdn.jsdelivr.net/npm/three@0.169.0/**",r=>{const rel=new URL(r.request().url()).pathname.replace("/npm/three@0.169.0/","");r.fulfill({contentType:"text/javascript",body:readFileSync(resolve("node_modules/three",rel))});});
 await page.goto("/nha3d/index.html?scene="+scene+"&me="+who);await page.waitForFunction(()=>window.__NHA3D__?.ready,null,{timeout:90000});
 const N=(f,...args)=>page.evaluate(([f,args])=>window.__NHA3D__[f](...args),[f,args]);await N("pauseAI",true);
 return {N,errors,requests};
}
async function tapItem(page,N,uid,label){
 await N("nearItem",uid);await N("tick",2);let pt=null;
 for(const f of [.4,.6,.2,.8]){const[x,y]=await N("screenOfItem",uid,f);for(const dx of [0,-6,6])if(!pt&&x+dx>0&&x+dx<page.viewportSize().width&&y>0&&y<page.viewportSize().height&&await N("pickAt",x+dx,y)===uid&&await page.evaluate(([x,y])=>document.elementFromPoint(x,y)?.id==="world",[x+dx,y]))pt=[x+dx,y];}
 expect(pt,uid).not.toBeNull();await page.mouse.click(...pt);await expect(page.getByRole("button",{name:label,exact:true})).toBeVisible({timeout:5000});await page.getByRole("button",{name:label,exact:true}).click();await N("tick",15);
}
async function shot(page,name){mkdirSync("test-results/date-evidence",{recursive:true});await page.screenshot({path:"test-results/date-evidence/"+name+".png"});}
for(const width of [360,390,430])test("date island: drink turns, timed fishing and return at "+width+"px",async({page})=>{
 const {N,errors,requests}=await open(page,width,width===390?"san":"hen");
 const old=await page.evaluate(()=>[localStorage.getItem("gocnho.nha3d.layout.v1"),localStorage.getItem("gocnho.nha3d.yard.v1"),localStorage.getItem("hu-hen-ho-v2")]);
 if(width===390){await tapItem(page,N,"y-d1","⛵ Đi thuyền sang đảo hẹn hò");await N("settle");expect(await N("scene")).toBe("hen");}
 expect(await N("scene")).toBe("hen");
 await N("remoteChanges",[{id:"m_hen",data:{wall:"hong",floor:"da"}}]);
 await tapItem(page,N,"h-cook","Cùng pha đồ uống");
 await expect(page.locator("#dateplay")).toContainText("bạn mô phỏng");
 await page.getByRole("button",{name:"🍓 Sinh tố dâu đôi",exact:true}).click();
 await page.getByRole("button",{name:"Dâu",exact:true}).click();
 await expect(page.locator("#dateplay")).toContainText("Đến lượt bạn mô phỏng");
 await page.getByRole("button",{name:"Cho bạn mô phỏng thực hiện lượt",exact:true}).click();
 await page.getByRole("button",{name:"Lắc ngay!",exact:true}).click();
 await page.getByRole("button",{name:"Cho bạn mô phỏng thực hiện lượt",exact:true}).click();
 await expect.poll(()=>N("date").then(s=>s.cook?.phase)).toBe("done");
 expect((await N("date")).cook.album.dau).toBeGreaterThan(0);await N("tick",.2);
 await shot(page,"drink-panel-"+width);
 const close=page.getByRole("button",{name:"Đóng hoạt động",exact:true});const box=await close.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);expect(box.height).toBeGreaterThanOrEqual(44);
 await close.click();await shot(page,"island-"+width);
 await tapItem(page,N,"h-fish","Thả câu, chờ cá cắn");
 await page.getByRole("button",{name:"🎣 Thả câu",exact:true}).click();
 const fish=(await N("date")).fish;expect(fish.phase).toBe("waiting");
 await expect.poll(async()=>{const m=await N("me"),[x,y]=await N("screenOfWorld",m.x,1.32,m.z),panel=await page.locator("#dateplay").boundingBox();return y>panel.y+panel.height+8&&y<694&&x>0&&x<width;}).toBe(true);
 await shot(page,"casting-"+width);
 // Freeze browser wall-clock at the bite's middle so GPU speed cannot decide whether a catch succeeds.
 await page.clock.setFixedTime(new Date(fish.biteAt+850));await N("tick",.1);
 await page.getByRole("button",{name:"Giật cần!",exact:true}).click();
 expect((await N("date")).fish.phase).toBe("caught");expect((await N("date")).fish.total).toBe(1);
 await N("tick",.2);await shot(page,"fishing-"+width);await close.click();
 if(width===390){await page.getByRole("button",{name:"Hoạt động hẹn hò",exact:true}).click();await page.getByRole("button",{name:"🔥 Đến thảm, ngồi cạnh nhau",exact:true}).click();await N("tick",30);expect((await N("me")).mode).toBe("sit");expect((await N("partner")).mode).toBe("sit");await shot(page,"picnic-390");}
 // Return via the actual dock menu.
 await tapItem(page,N,"h-return","Đi thuyền về sân nhà");await N("settle");
 expect(await N("scene")).toBe("san");expect(await page.locator("#dateplay").isVisible()).toBe(false);
 const after=await page.evaluate(()=>[localStorage.getItem("gocnho.nha3d.layout.v1"),localStorage.getItem("gocnho.nha3d.yard.v1"),localStorage.getItem("hu-hen-ho-v2")]);expect(after).toEqual(old);
 expect(errors).toEqual([]);expect(requests).toEqual([]);
});
test("date activities: two isolated clients share turns; offline never dispatches or auto-replays",async({browser})=>{
 const ca=await browser.newContext(),cb=await browser.newContext();const pa=await ca.newPage(),pb=await cb.newPage();
 try{
 const a=await open(pa),b=await open(pb,390,"hen","em");let shared=null,calls=0;
 for(const[page,uid,who]of[[pa,"alice","anh"],[pb,"bob","em"]]){
  await page.exposeFunction("dateCommand",async(kind,command)=>{
   calls++;shared=A.advanceActivity(shared,{...command,kind,uid,now:Date.now()});
   const change={id:"a_date_cook",data:shared};
   await Promise.all([pa,pb].map(p=>p.evaluate(c=>window.__NHA3D__.remoteChanges([c]),change)));return change;
  });
  await page.evaluate(({uid,who})=>{
   const api={uid,setPresence(){},actDate:(k,c)=>window.dateCommand(k,c)};
   window.__NHA3D__.useFakeCloud(api);

  },{uid,who});

 }

 await a.N("nearItem","h-cook");await a.N("tick",2);await a.N("openDate","cook");
 await b.N("nearItem","h-cook");await b.N("tick",2);await b.N("openDate","cook");
 await pa.getByRole("button",{name:"🍓 Sinh tố dâu đôi",exact:true}).click();
 await pa.getByRole("button",{name:"Dâu",exact:true}).click();
 await expect(pb.locator("#dateplay")).toContainText("Thêm Sữa");
 const before=calls;await a.N("dateAction","cook","ingredient","sua",true);expect(calls).toBe(before);
 await cb.setOffline(true);await b.N("dateAction","cook","ingredient","sua");expect(calls).toBe(before);
 await cb.setOffline(false);await b.N("tick",.1);expect(calls).toBe(before);
 await pb.getByRole("button",{name:"Sữa",exact:true}).click();
 await pa.getByRole("button",{name:"Lắc ngay!",exact:true}).click();
 await pb.getByRole("button",{name:"Lắc ngay!",exact:true}).click();
 expect((await a.N("date")).cook.phase).toBe("done");expect((await b.N("date")).cook).toEqual((await a.N("date")).cook);
 expect(new Set(shared.steps.map(s=>s.uid)).size).toBe(2);
 const older={...shared,rev:shared.rev-1,phase:"making",steps:shared.steps.slice(0,3)};
 await a.N("remoteChanges",[{id:"a_date_cook",data:older}]);expect((await a.N("date")).cook.phase).toBe("done");
 await a.N("remoteChanges",[{id:"p_em",data:{k:"presence",who:"em",scene:"hen",x:0,z:2,face:0,mode:"idle",at:Date.now()}}]);await a.N("tick",.1);
 expect((await a.N("cloud")).partnerVisible).toBe(true);
 expect(a.errors.concat(b.errors)).toEqual([]);expect(a.requests.concat(b.requests)).toEqual([]);
 }finally{await ca.close();await cb.close();}
});
