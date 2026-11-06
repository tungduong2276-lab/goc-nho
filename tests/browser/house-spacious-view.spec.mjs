import {test,expect} from "@playwright/test";
const rooms=["phong-khach","bep","phong-anh","phong-em","goc-sang-tao","gac"];
test("spacious viewport uses screen width without horizontal overflow or touching other tabs",async ({page})=>{
  test.setTimeout(120000);
  await page.addInitScript(()=>localStorage.setItem("hu-hen-ho-me","0"));
  await page.route("https://www.gstatic.com/**",r=>r.abort());
  for(const width of [360,390,430,1300]){
    await page.setViewportSize({width,height:950});
    for(const room of rooms){
      await page.goto("/index.html#"+room);
      const stage=page.locator("#v-"+room+" .room3d");
      await expect(stage).toBeVisible();
      // Route render is asynchronous; don't sample a DOM element while its
      // parent view is being torn down and rebuilt. Every geometry assertion
      // remains mandatory once the scene has settled.
      await expect.poll(async()=>{
        return stage.evaluate(el=>{
          const box=el.getBoundingClientRect();
          return box.width>0 && box.left>=-2;
        }).catch(()=>false);
      },{timeout:10000,message:room+" must render a stable stage at "+width}).toBe(true);
      await expect.poll(async()=>{
        const box=await stage.evaluate(el=>{
          const r=el.getBoundingClientRect();
          return {w:r.width,l:r.left,right:r.right};
        }).catch(()=>({w:0,l:-100,right:99999}));
        const pageWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
        return box.w>=(width>=1000?700:width-40)&&box.l>=-2&&box.right<=width+2&&pageWidth<=width+3;
      },{timeout:10000,message:room+" must occupy safe visible space at "+width}).toBe(true);
    }
  }
});
