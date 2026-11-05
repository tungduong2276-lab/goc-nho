import {test,expect} from "@playwright/test";
import {mkdirSync,writeFileSync} from "node:fs";
import {join} from "node:path";
const rooms=["phong-khach","bep","phong-anh","phong-em","goc-sang-tao","gac"];
test("contact authoring is opt-in, six-room, keyboard-friendly, non-persistent, and has no Firebase traffic",async ({page})=>{
 test.setTimeout(150000);
 mkdirSync("review-artifacts/house-contact",{recursive:true});
 const urls=[];page.on("request",r=>urls.push(r.url()));
 await page.setViewportSize({width:390,height:880});
 await page.goto("/experiments/house-contact-review.html");
 await expect(page.locator("#editor")).toBeHidden();
 await page.locator("#enable").click();
 await expect(page.locator("#editor")).toBeVisible();
 for(const id of rooms){
  await page.locator("#room").selectOption(id);
  await expect(page.locator("#layer option").first()).toHaveText(/\w+/);
  await expect.poll(()=>page.locator("#background").evaluate(img=>img.complete&&img.naturalWidth===1170)).toBe(true);
  await expect(page.locator("#layers img.sprite").first()).toBeAttached();
  for(const [x,y] of [[450,720],[540,720],[510,800]]){
   await page.locator("#x").fill(String(x));
   await page.locator("#y").fill(String(y));
   await page.locator("#add").click();
  }
  await expect(page.locator("#point-count")).toContainText("3 điểm");
  await page.locator("#commit").click();
  await expect(page.locator("#status")).toContainText("CHƯA ĐƯỢC DUYỆT");
  await page.locator("#export-button").click();
  const json=JSON.parse(await page.locator("#export").inputValue());
  expect(json.canPersist).toBe(false);
  expect(json.proposals.some(p=>p.roomId===id)).toBe(true);
  writeFileSync(join("review-artifacts/house-contact","contact-"+id+"-390.png"),
   await page.screenshot({fullPage:true,animations:"disabled"}));
 }
 await expect(page.locator("#point-count")).toContainText("6 đề xuất");
 await page.locator("#reset").click();
 await expect(page.locator("#point-count")).toContainText("0 đề xuất");
 await page.reload();
 await expect(page.locator("#editor")).toBeHidden();
 expect(urls.some(u=>/firestore|firebase|identitytoolkit|gstatic|googleapis/i.test(u))).toBe(false);
});
test("contact editor stays within mobile screen and offers click as well as manual entry",async ({page})=>{
 for(const width of [360,390,430]){
  await page.setViewportSize({width,height:850});
  await page.goto("/experiments/house-contact-review.html");
  await page.locator("#enable").click();
  const stage=page.locator("#stage");
  await expect(stage).toBeVisible();
  await stage.click({position:{x:50,y:50}});
  await expect(page.locator("#point-count")).toContainText("1 điểm");
  const max=await page.evaluate(()=>document.documentElement.scrollWidth);
  expect(max).toBeLessThanOrEqual(width+2);
 }
});
