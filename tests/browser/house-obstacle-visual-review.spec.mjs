import {test,expect} from "@playwright/test";
import {mkdirSync,writeFileSync} from "node:fs";
import {join} from "node:path";
const rooms=["phong-khach","bep","phong-anh","phong-em","goc-sang-tao","gac"];
const output="test-results/house-visual-review";
test("export red visible-object review masks over six local rooms, without cloud requests",async ({page})=>{
  test.setTimeout(90000);
  mkdirSync(output,{recursive:true});
  await page.setViewportSize({width:390,height:844});
  await page.goto("/experiments/house-placement.html");
  await expect(page.locator("#editor")).toBeHidden();
  await page.locator("#enable").click();
  await expect(page.locator("#editor")).toBeVisible();
  const shots=[];
  for(const room of rooms){
    await page.locator("#room").selectOption(room);
    await expect(page.locator(".obstacle-review")).toHaveCount(2);
    await expect(page.locator(".floor-zone")).toHaveCount(2);
    await expect(page.locator(".walkway-overlay line")).toHaveCount(1);
    await expect(page.locator(".walkway-overlay circle")).toHaveCount(2);
    await expect(page.locator("#walkway-status")).toContainText(/Lối đi|Không tìm thấy/);
    const image=page.locator("#background");
    await expect.poll(()=>image.evaluate(el=>el.complete&&el.naturalWidth===1170)).toBe(true);
    await page.locator("#stage").screenshot({path:join(output,"obstacles-"+room+"-390.png"),animations:"disabled"});
    shots.push({room,file:"obstacles-"+room+"-390.png",obstacles:2,walkway:"SOURCE_STANDING_ANCHORS_UNVERIFIED",doorway:"UNTRACED",floor:"UNTRACED"});
  }
  writeFileSync(join(output,"obstacle-review-manifest.json"),JSON.stringify({
    status:"UNAPPROVED_VISUAL_ESTIMATES",sourceCI:"41953137827",viewport:390,
    automatedCaptureOnly:true,verifiedCollisionMeshes:false,verifiedWithHuman:false,
    doorwayStatus:"UNTRACED",floorStatus:"UNTRACED",walkwayApproval:false,shots,
    safety:"No production Firebase and no persistence; inspect screenshot masks before any release",
  },null,2)+"\n");
  expect(shots).toHaveLength(6);
});
