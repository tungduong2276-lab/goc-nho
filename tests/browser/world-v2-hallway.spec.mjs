import {test,expect} from "@playwright/test";

async function visit(page,room,width=390,reduced=true){
  await page.setViewportSize({width,height:844});
  if(reduced)await page.emulateMedia({reducedMotion:"reduce"});
  await page.addInitScript(()=>localStorage.setItem("hu-hen-ho-me","0"));
  await page.goto("/index.html?world2=1#"+room);
  const root=page.locator("#v-"+room);
  await expect(root).toBeVisible();
  await expect(root.locator(".gn2-walk-avatar")).toHaveCount(1);
  const button=root.getByRole("button",{name:"Đi bộ ra hiên và vào hành lang chung"});
  await expect(button).toBeVisible();
  return {root,button};
}
test("all seven scenes have a visible front-edge threshold that doesn't intercept props",async({page})=>{
  for(const room of ["phong-khach","bep","phong-anh","phong-em","goc-sang-tao","gac","khu-vuon"]){
    const {root,button}=await visit(page,room,390);
    await expect(button).toHaveAttribute("data-gn2-room",room);
    await expect(root.locator(".gn2-walk-avatar")).toHaveCount(1);
    const area=await button.boundingBox();
    expect(area.width).toBeGreaterThan(45);
    expect(area.height).toBeGreaterThan(30);
    await page.screenshot({path:"test-results/world-v2-porch-"+room+"-390.png",fullPage:true});
  }
});
test("walk to porch first, then open real corridor overlay without changing hash",async({page})=>{
  const {button}=await visit(page,"bep");
  await button.click();
  await expect(page.locator("#gn2-hall")).toBeVisible({timeout:9000});
  expect(new URL(page.url()).hash).toBe("#bep");
  await expect(page.getByRole("button",{name:"Vào Gác kỷ niệm"})).toBeVisible();
  await expect(page.locator(".gn2-hall-door")).toHaveCount(7);
  await page.screenshot({path:"test-results/world-v2-hallway-390.png",fullPage:true});
  await page.getByRole("button",{name:"Quay lại phòng hiện tại"}).click();
  await expect(page.locator("#gn2-hall")).not.toBeVisible();
  expect(new URL(page.url()).hash).toBe("#bep");
});
test("corridor requires avatar arrival before entering another room, with valid front-edge entry",async({page})=>{
  const {button}=await visit(page,"bep");
  await button.click();
  await expect(page.locator("#gn2-hall")).toBeVisible();
  await page.getByRole("button",{name:"Vào Phòng Em"}).click();
  await expect(page).toHaveURL(/#phong-em$/,{timeout:7000});
  await expect(page.locator("#gn2-hall")).not.toBeVisible();
  const avatar=page.locator("#v-phong-em .gn2-walk-avatar");
  await expect(avatar).toHaveCount(1);
  const p=await avatar.evaluate(el=>[Number(el.dataset.gn2X),Number(el.dataset.gn2Y)]);
  expect(p[0]).toBeCloseTo(585,0);
  expect(p[1]).toBeCloseTo(914,0);
  await page.getByRole("button",{name:"Đi bộ ra hiên và vào hành lang chung"}).click();
  await expect(page.locator("#gn2-hall")).toBeVisible();
  await page.getByRole("button",{name:"Vào Khu vườn"}).click();
  await expect(page).toHaveURL(/#khu-vuon$/,{timeout:7000});
  await expect(page.locator("#v-khu-vuon .gn2-walk-avatar")).toHaveCount(1);
});
test("keyboard and Escape can enter and cancel a corridor without losing room",async({page})=>{
  const {button}=await visit(page,"goc-sang-tao",430);
  await button.focus();await button.press("Enter");
  await expect(page.locator("#gn2-hall")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#gn2-hall")).not.toBeVisible();
  expect(new URL(page.url()).hash).toBe("#goc-sang-tao");
  await button.focus();await button.press("Enter");
  const destination=page.getByRole("button",{name:"Vào Phòng khách"});
  await expect(destination).toBeVisible();
  await destination.focus();await destination.press("Enter");
  await expect(page).toHaveURL(/#phong-khach$/,{timeout:7000});
});
test("porch journey survives forced room rebuild and still reaches the corridor",async({page})=>{
  const {button}=await visit(page,"bep",390,false);
  await button.click();
  await page.waitForTimeout(130);
  await page.evaluate(()=>renderRooms());
  await expect(page.locator("#v-bep .gn2-porch-threshold")).toBeVisible();
  await expect(page.locator("#gn2-hall")).toBeVisible({timeout:11000});
  expect(new URL(page.url()).hash).toBe("#bep");
});
test("another movement cancels a pending porch transition rather than opening a stale corridor",async({page})=>{
  const {root,button}=await visit(page,"bep",390,false);
  await button.click();
  await page.waitForTimeout(120);
  await root.getByRole("button",{name:"Di chuyển trái"}).click();
  await page.waitForTimeout(3300);
  await expect(page.locator("#gn2-hall")).not.toBeVisible();
  expect(new URL(page.url()).hash).toBe("#bep");
});
test("mobile hallway fits 360/390/430 and vanilla app stays fully opt-out",async({page})=>{
  for(const width of [360,390,430]){
    const {button}=await visit(page,"bep",width);
    await button.click();
    const dialog=page.locator("#gn2-hall");
    await expect(dialog).toBeVisible();
    const bounds=await dialog.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(-1);
    expect(bounds.x+bounds.width).toBeLessThanOrEqual(width+1);
    await page.screenshot({path:"test-results/world-v2-hallway-"+width+".png",fullPage:true});
    await dialog.getByRole("button",{name:"Quay lại phòng hiện tại"}).click();
  }
  await page.goto("/#bep");
  await expect(page.locator("#gn2-hall")).toHaveCount(0);
  await expect(page.locator(".gn2-porch-threshold")).toHaveCount(0);
  expect(await page.evaluate(()=>window.__GN_WORLD_V2__)).toBeUndefined();
});
