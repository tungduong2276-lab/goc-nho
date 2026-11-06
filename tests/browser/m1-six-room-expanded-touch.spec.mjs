import {test,expect} from "@playwright/test";
import {readFileSync} from "node:fs";
const scene=JSON.parse(readFileSync("assets/3d/scene.json","utf8"));
const rooms=[
 ["phong-khach",scene.room,[7,7]],
 ["bep",scene.rooms.bep,[7,7]],
 ["phong-anh",scene.rooms.phong_anh,[7,7]],
 ["phong-em",scene.rooms.phong_em,[7,7]],
 ["goc-sang-tao",scene.rooms.sang_tao,[7,7]],
 ["gac",scene.rooms.gac,[7,5]]
];
test("physically wider rooms remain viewable and interactive on four viewport widths",async({page})=>{
 test.setTimeout(180000);
 await page.addInitScript(()=>localStorage.setItem("hu-hen-ho-me","0"));
 await page.route("https://www.gstatic.com/**",r=>r.abort());
 for(const width of [360,390,430,1300]){
  await page.setViewportSize({width,height:920});
  for(const [id,meta,world] of rooms){
   expect(meta.sourceWorldFloorMetres).toEqual(world);
   expect(meta.floorCollisionVerified).toBe(false);
   expect(meta.doorwayWalkwayVerified).toBe(false);
   await page.goto("/index.html#"+id);
   const stage=page.locator("#v-"+id+" .room3d .wcanvas");
   await expect(stage).toBeVisible();
   const background=stage.locator("img.wbg");
   await expect(background).toBeVisible();
   await expect.poll(()=>background.evaluate(img=>img.complete&&img.naturalWidth>0),{timeout:10000}).toBe(true);
   const hot=stage.locator(".lay.hot");
   await expect.poll(()=>hot.count(),{timeout:10000}).toBeGreaterThan(0);
   const candidate=await hot.evaluateAll(nodes=>nodes.some(el=>{
    const box=el.getBoundingClientRect();
    const view=el.closest(".wcanvas")?.getBoundingClientRect();
    if(!view||box.width<=1||box.height<=1)return false;
    for(let y=1;y<=5;y++)for(let x=1;x<=5;x++){
     const px=box.left+x*box.width/6,py=box.top+y*box.height/6;
     if(px<0||py<0||px>innerWidth||py>innerHeight)continue;
     const at=document.elementFromPoint(px,py);
     if(at===el||el.contains(at))return true;
    }
    return false;
   }));
   expect(candidate, id+" needs at least one genuinely reachable on-screen furniture touch target at "+width).toBe(true);
   const scroll=await page.evaluate(()=>document.documentElement.scrollWidth);
   expect(scroll,id+" must not overflow "+width+"px screen").toBeLessThanOrEqual(width+3);
  }
 }
});
