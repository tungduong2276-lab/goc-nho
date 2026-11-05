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
      const measured=await stage.evaluate(el=>({width:el.getBoundingClientRect().width,
        left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right}));
      expect(measured.width).toBeGreaterThanOrEqual(width>=1000?700:width-40);
      expect(measured.left).toBeGreaterThanOrEqual(-2);
      expect(measured.right).toBeLessThanOrEqual(width+2);
      const htmlWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
      expect(htmlWidth).toBeLessThanOrEqual(width+3);
    }
  }
});
