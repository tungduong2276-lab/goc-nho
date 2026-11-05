import {test,expect} from "@playwright/test";
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {join} from "node:path";
const rooms=["phong-khach","bep","phong-anh","phong-em","goc-sang-tao","gac"];
test("six-room floor geometry editor exports review-only evidence with no Firebase traffic",async ({page})=>{
 test.setTimeout(150000);
 mkdirSync("review-artifacts/house-floor",{recursive:true});
 const urls=[];page.on("request",r=>urls.push(r.url()));
 await page.setViewportSize({width:390,height:900});
 await page.goto("/experiments/house-floor-review.html");
 await expect(page.locator("#editor")).toBeHidden();
 await page.locator("#enable").click();
 await expect(page.locator("#editor")).toBeVisible();
 for(const room of rooms){
  await page.locator("#room").selectOption(room);
  await expect.poll(()=>page.locator("#background").evaluate(img=>img.complete&&img.naturalWidth===1170)).toBe(true);
  for(const [x,y] of [[400,600],[700,600],[700,850],[400,850]]){
   await page.locator("#x").fill(String(x));await page.locator("#y").fill(String(y));
   await page.locator("#add").click();
  }
  await page.locator("#commit").click();
  await expect(page.locator("#status")).toContainText("CHƯA ĐƯỢC DUYỆT");
  await expect(page.locator("#summary")).toContainText("doorway, walkway");
  writeFileSync(join("review-artifacts/house-floor",room+"-390.png"),
   await page.screenshot({fullPage:true,animations:"disabled"}));
 }
 await expect(page.locator("#counter")).toContainText("6 vùng chưa duyệt");
 await page.locator("#export-button").click();
 const b=JSON.parse(await page.locator("#export").inputValue());
 expect(b.canPersist).toBe(false);expect(b.readiness).toHaveLength(6);
 expect(b.annotations).toHaveLength(6);
 for(const room of rooms)expect(b.annotations.some(x=>x.roomId===room&&x.role==="floor")).toBe(true);
 await page.locator("#reset").click();
 await expect(page.locator("#counter")).toContainText("0 vùng");
 await page.reload();await expect(page.locator("#editor")).toBeHidden();
 expect(urls.some(u=>/firestore|firebase|identitytoolkit|gstatic|googleapis/i.test(u))).toBe(false);
});
test("doorway and walkway are flagged outside proposed floor and not treated as approval",async ({page})=>{
 for(const width of [360,390,430]){
  await page.setViewportSize({width,height:850});
  await page.goto("/experiments/house-floor-review.html");
  await page.locator("#enable").click();
  await page.locator("#role").selectOption("doorway");
  for(const [x,y] of [[30,30],[100,30],[100,100],[30,100]]){
   await page.locator("#x").fill(String(x));await page.locator("#y").fill(String(y));await page.locator("#add").click();
  }
  await page.locator("#commit").click();
  await page.locator("#export-button").click();
  const b=JSON.parse(await page.locator("#export").inputValue());
  const x=b.readiness.find(x=>x.roomId==="phong-khach");
  expect(x.missing).toContain("floor");
  expect(x.canPersist).toBe(false);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+2);
 }
});
test("fixed-contact annotations require a real scene layer and reject duplicates",async ({page})=>{
 await page.goto("/experiments/house-floor-review.html");await page.locator("#enable").click();
 await page.locator("#role").selectOption("fixed_contact");
 await expect(page.locator("#layer-control")).toBeVisible();
 const source=JSON.parse(readFileSync("assets/3d/scene.json","utf8"));
 const room=source.room;
 expect(Object.keys(room.layers).length).toBeGreaterThan(0);
 for(const [x,y] of [[400,650],[500,650],[500,730]]){
  await page.locator("#x").fill(String(x));await page.locator("#y").fill(String(y));await page.locator("#add").click();
 }
 await page.locator("#commit").click();
 await expect(page.locator("#counter")).toContainText("1 vùng");
 for(const [x,y] of [[400,650],[500,650],[500,730]]){
  await page.locator("#x").fill(String(x));await page.locator("#y").fill(String(y));await page.locator("#add").click();
 }
 await page.locator("#commit").click();
 await expect(page.locator("#status")).toContainText("DUPLICATE_CONTACT_ANNOTATION");
 await expect(page.locator("#counter")).toContainText("1 vùng");
});

test("six-room review composes actual first-state furniture sprite images, never inferred colliders",async ({page})=>{
 await page.setViewportSize({width:390,height:900});
 await page.goto("/experiments/house-floor-review.html");
 await page.locator("#enable").click();
 for(const room of rooms){
  await page.locator("#room").selectOption(room);
  const sprites=page.locator("#layers img[data-layer]");
  expect(await sprites.count()).toBeGreaterThan(0);
  await expect.poll(()=>sprites.evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0&&img.naturalHeight>0)),{timeout:10000}).toBe(true);
  for(const layer of await sprites.evaluateAll(images=>images.map(img=>img.dataset.layer))){
   expect(typeof layer).toBe("string");
  }
  const review=await page.locator("#summary").textContent();
  expect(review).toContain("CHƯA ĐƯỢC DUYỆT");
 }
 await page.locator("#room").selectOption("phong-anh");
 await page.locator("#role").selectOption("fixed_contact");
 await page.locator("#layer").selectOption("giuong_ngu");
 await expect(page.locator('#layers img[data-layer="giuong_ngu"]')).toHaveCount(1);
 await expect(page.locator('#layers img[data-layer="giuong_gon"]')).toHaveCount(0);
 await page.locator("#show-furniture").uncheck();
 await expect(page.locator("#layers img")).toHaveCount(0);
 await page.locator("#show-furniture").check();
 await expect(page.locator("#layers img").first()).toBeVisible();
});
