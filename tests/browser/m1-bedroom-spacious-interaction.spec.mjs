import {test,expect} from "@playwright/test";
import {readFileSync} from "node:fs";
const scene=JSON.parse(readFileSync("assets/3d/scene.json","utf8"));
test("new bedroom interactive sprite images match actual hitboxes on mobile/wide",async ({page})=>{
 test.setTimeout(120000);
 await page.addInitScript(()=>localStorage.setItem("hu-hen-ho-me","0"));
 await page.route("https://www.gstatic.com/**",r=>r.abort());
 for(const width of [360,390,430,1300]){
  await page.setViewportSize({width,height:920});
  for(const room of ["phong-anh","phong-em"]){
    const source=room==="phong-anh"?"phong_anh":"phong_em";
    await page.goto("/index.html#"+room);
    const stage=page.locator("#v-"+room+" .room3d .wcanvas");
    await expect(stage).toBeVisible();
    for(const id of Object.keys(scene.rooms[source].items)){
      const target=stage.locator('button[data-ri="'+id+'"]');
      await expect(target).toBeVisible();
      const im=target.locator("img[src]");
      await expect.poll(()=>im.evaluate(img=>img.complete&&img.naturalWidth>0),{timeout:10000}).toBe(true);
      await expect.poll(async()=>{
        try{
          return await target.evaluate((el,{id,room})=>{
            const sprite=el.querySelector("img");
            if(!sprite)return false;
            const r=el.getBoundingClientRect();
            const parent=el.closest(".wcanvas").getBoundingClientRect();
            const scale=parent.width/1170;
            if(!scale||r.width<=0||r.height<=0)return false;
            const topLeft=[(r.left-parent.left)/scale,(r.top-parent.top)/scale];
            const key=el.querySelector("img").getAttribute("src").split("/").pop().replace(room+"_","").replace(".webp","");
            return key.startsWith(id+"_")&&topLeft.every(Number.isFinite);
          },{id,room:source});
        }catch{return false;}
      }).toBe(true);
    }
    const bed=stage.locator('button[data-ri="giuong"]');
    await bed.click({trial:true});
    const fullWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
    expect(fullWidth).toBeLessThanOrEqual(width+3);
  }
 }
});
