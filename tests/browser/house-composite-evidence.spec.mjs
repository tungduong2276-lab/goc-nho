import {test,expect} from "@playwright/test";
import {mkdirSync,writeFileSync,readFileSync} from "node:fs";
import {join} from "node:path";
import {auditSixRoomComposites} from "../../src/house-composite-evidence.mjs";
// Review only: actual UI compositing, *not* backdrop-only screenshots.
// Blue outlines are real scene.json sprite-image extents, not collision boxes.
const scene=JSON.parse(readFileSync("assets/3d/scene.json","utf8"));
const reports=auditSixRoomComposites(scene);
const names={"phong-khach":"Phòng khách",bep:"Bếp","phong-anh":"Phòng Anh","phong-em":"Phòng Em",
  "goc-sang-tao":"Góc sáng tạo",gac:"Gác kỷ niệm"};
// Keep screenshots outside Playwright-managed test-results, which may be cleaned
// by other concurrent workers before GitHub uploads the review bundle.
const folder="review-artifacts/house-composite";

test("capture real six-room composites with actual sprite extents at mobile and wide viewport",async ({page})=>{
 test.setTimeout(150000);
 mkdirSync(folder,{recursive:true});
 await page.addInitScript(()=>localStorage.setItem("hu-hen-ho-me","0"));
 await page.route("https://www.gstatic.com/**",route=>route.abort());
 await page.route("https://fonts.googleapis.com/**",route=>route.abort());
 await page.route("https://fonts.gstatic.com/**",route=>route.abort());
 const captures=[];
 for(const width of [390,1300]){
   await page.setViewportSize({width,height:950});
   for(const [id,report] of Object.entries(reports)){
     await page.goto("/index.html#"+id);
     const room=page.locator("#v-"+id+" .room3d"),canvas=room.locator(".wcanvas");
     await expect(room).toBeVisible();
     await expect.poll(()=>room.locator(".wbg").evaluate(img=>
       img.complete&&img.naturalWidth===1170&&img.naturalHeight===1170)).toBe(true);
     await expect.poll(()=>canvas.evaluate(el=>{
       const r=el.getBoundingClientRect();return r.width>=300&&r.height>=300;
     })).toBe(true);
     // Verify all current non-living-room interactive furniture sprites use scene.json
     // geometry after responsive scaling. These are DOM layout bounds, not alpha hulls.
     const checked=await canvas.evaluate((node,{layers,ignoreLiving})=>{
       const scale=node.getBoundingClientRect().width/1170;
       const r0=node.getBoundingClientRect();const observed=[];
       if(!ignoreLiving){
         for(const button of node.querySelectorAll("button[data-ri]")){
           const image=button.querySelector("img[src]");
           const marker=image?.getAttribute("src")||"";
           const match=Object.entries(layers).find(([key])=>marker.includes("_"+key+"."));
           if(!match)throw new Error("Sprite lacks matching scene layer: "+marker);
           const b=match[1],r=button.getBoundingClientRect();
           const actual=[(r.left-r0.left)/scale,(r.top-r0.top)/scale,
             (r.right-r0.left)/scale,(r.bottom-r0.top)/scale];
           if(actual.some((n,i)=>Math.abs(n-b[i])>2))
             throw new Error("DOM/image scene geometry mismatch "+match[0]+": "+JSON.stringify({actual,expected:b}));
           observed.push(match[0]);
         }
         if(observed.length===0)throw new Error("Room has no actual composited furniture sprite buttons");
       }else if(node.querySelectorAll(".lay img").length===0)
         throw new Error("Living room missing composite sprite overlays");
       return observed;
     },{layers:Object.fromEntries(report.layers.map(l=>[l.layerId,l.box])),ignoreLiving:id==="phong-khach"});
     await canvas.evaluate((node,{layers})=>{
       const ns="http://www.w3.org/2000/svg";
       const svg=document.createElementNS(ns,"svg");svg.setAttribute("viewBox","0 0 1170 1170");
       svg.setAttribute("data-composite-audit","true");svg.setAttribute("aria-hidden","true");
       Object.assign(svg.style,{position:"absolute",left:"0",top:"0",width:"1170px",height:"1170px",pointerEvents:"none",zIndex:"99999"});
       for(const layer of layers){
         const b=layer.box,rect=document.createElementNS(ns,"rect");
         rect.setAttribute("x",b[0]);rect.setAttribute("y",b[1]);
         rect.setAttribute("width",b[2]-b[0]);rect.setAttribute("height",b[3]-b[1]);
         rect.setAttribute("fill","none");rect.setAttribute("stroke","#167cc2");
         rect.setAttribute("stroke-width","4");rect.setAttribute("stroke-opacity",".68");
         svg.append(rect);
       }
       node.append(svg);
     },{layers:report.layers});
     await expect(canvas.locator("[data-composite-audit] rect")).toHaveCount(report.layers.length);
     const file="composite-"+id+"-"+width+".png";
     // A Firebase/local rerender may replace .room3d while an element screenshot\n     // waits for stability. Capture the current page instead of a stale node.\n     await page.screenshot({path:join(folder,file),fullPage:true,animations:"disabled"});
     captures.push({id,width,title:names[id],file,
       sourceLayerCount:report.layers.length,renderedInteractiveLayers:checked,
       state:"COMPOSITED_RENDER_REVIEW_ONLY",floor:"UNTRACED",door:"UNTRACED",
       imageBoundsNotCollisionHulls:true});
   }
 }
 writeFileSync(join(folder,"composite-evidence-manifest.json"),JSON.stringify({
   approval:"UNAPPROVED",source:"assets/3d/scene.json",
   imagePixels:[1170,1170],sourceIsFullComposite:true,
   note:"Blue rectangles are sprite image extents, often transparent; NOT collision geometry",
   productionDataRead:false,productionDataWritten:false,captures,
 },null,2)+"\n");
 expect(captures).toHaveLength(12);
});
