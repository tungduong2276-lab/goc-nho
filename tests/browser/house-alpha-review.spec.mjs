import {test,expect} from "@playwright/test";
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import {ROOM_SOURCES} from "../../src/house-placement-preview.mjs";
const scene=JSON.parse(readFileSync("assets/3d/scene.json","utf8"));
const folder="review-artifacts/house-alpha";

test("review real alpha silhouettes over six composited rooms; never infer floor contact",async ({page})=>{
 test.setTimeout(150000);
 mkdirSync(folder,{recursive:true});
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>localStorage.setItem("hu-hen-ho-me","0"));
 await page.route("https://www.gstatic.com/**",route=>route.abort());
 await page.route("https://fonts.googleapis.com/**",route=>route.abort());
 await page.route("https://fonts.gstatic.com/**",route=>route.abort());
 const records=[];
 for(const [id,sourceId] of Object.entries(ROOM_SOURCES)){
  const room=sourceId===null?scene.room:scene.rooms[sourceId];
  const selected=Object.entries(room.layers).slice(0,3);
  await page.goto("/index.html#"+id);
  await expect(page.locator("#v-"+id+" .room3d")).toBeVisible();
  await expect.poll(()=>page.locator("#v-"+id+" .room3d .wbg").evaluate(img=>
    img.complete&&img.naturalWidth===1170)).toBe(true);
  const results=await page.evaluate(async ({roomId,sourceId,selected})=>{
    const {analyzeAlphaPixels,sourceAlphaBounds}=await import("/src/house-alpha-footprint-review.mjs");
    const host=document.querySelector("#v-"+roomId+" .room3d .wcanvas");
    if(!host)throw new Error("MISSING_ROOM_CANVAS");
    const overlay=document.createElement("canvas");
    overlay.width=1170;overlay.height=1170;
    overlay.dataset.alphaReview="visual-only";
    Object.assign(overlay.style,{position:"absolute",left:"0",top:"0",
      width:"1170px",height:"1170px",pointerEvents:"none",zIndex:"99999"});
    const context=overlay.getContext("2d");
    const observations=[];
    for(const [name,box] of selected){
      const filename=(sourceId===null?"":sourceId+"_")+name+".webp";
      const image=new Image();image.src="/assets/3d/"+filename;
      await image.decode();
      const canvas=document.createElement("canvas");
      canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
      const ctx=canvas.getContext("2d",{willReadFrequently:true});
      ctx.drawImage(image,0,0);
      const raw=ctx.getImageData(0,0,canvas.width,canvas.height);
      const alpha=analyzeAlphaPixels({data:raw.data,width:canvas.width,height:canvas.height});
      const sourceBounds=sourceAlphaBounds(alpha,box);
      // Use destination-in on a separate surface to preserve the source's
      // alpha, then tint only nontransparent pixels; no rectangle fill.
      const tinted=document.createElement("canvas");
      tinted.width=image.naturalWidth;tinted.height=image.naturalHeight;
      const tc=tinted.getContext("2d");
      tc.drawImage(image,0,0);
      tc.globalCompositeOperation="source-in";
      tc.fillStyle="rgba(231,64,86,.85)";
      tc.fillRect(0,0,tinted.width,tinted.height);
      context.globalAlpha=.48;
      context.drawImage(tinted,box[0],box[1],box[2]-box[0],box[3]-box[1]);
      context.globalAlpha=1;
      if(sourceBounds){
        context.strokeStyle="#ae2744";context.lineWidth=3;
        context.strokeRect(sourceBounds[0],sourceBounds[1],
          sourceBounds[2]-sourceBounds[0],sourceBounds[3]-sourceBounds[1]);
      }
      observations.push({name,filename,opaquePixels:alpha.opaquePixels,
        alphaBounds:alpha.alphaBounds,sourceAlphaBounds:sourceBounds,
        declaredBox:box,coverage:alpha.opaqueRatio,
        contactStatus:"UNTRACED",approved:false,canPersist:false});
    }
    host.append(overlay);
    return observations;
  },{roomId:id,sourceId,selected});
  expect(results).toHaveLength(3);
  expect(results.some(x=>x.opaquePixels>0)).toBe(true);
  expect(results.every(x=>x.approved===false&&x.contactStatus==="UNTRACED")).toBe(true);
  const png=await page.screenshot({fullPage:true,animations:"disabled"});
  const file="alpha-"+id+"-390.png";
  writeFileSync(join(folder,file),png);
  records.push({roomId:id,file,layers:results,floorPolygon:null,
    doorways:null,walkableArea:null,status:"UNAPPROVED"});
 }
 writeFileSync(join(folder,"alpha-review-manifest.json"),JSON.stringify({
   protocol:"SPRITE_ALPHA_VISUAL_ONLY",source:"assets/3d/scene.json",
   reviewRequired:true,floorContactApproved:false,canPersist:false,records,
 },null,2)+"\n");
 expect(records).toHaveLength(6);
});
