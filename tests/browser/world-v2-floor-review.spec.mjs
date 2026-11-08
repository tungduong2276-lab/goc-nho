import {test,expect} from "@playwright/test";

async function openFloor(page,room,width=390,withOverlay=true){
  await page.setViewportSize({width,height:844});
  await page.addInitScript(()=>localStorage.setItem("hu-hen-ho-me","0"));
  await page.goto("/index.html?world2=1"+(withOverlay?"&floormap=1":"")+"#"+room);
  const root=page.locator("#v-"+room);
  await expect(root).toBeVisible();
  await expect(root.locator(".gn2-walk-avatar")).toHaveCount(1);
  return root;
}
test("seven actual rooms expose the correct floor and object geometry in QA view",async({page})=>{
  const rooms=["phong-khach","bep","phong-anh","phong-em","goc-sang-tao","gac","khu-vuon"];
  for(const room of rooms){
    const root=await openFloor(page,room,390);
    const svg=root.locator("svg.gn2-floor-review");
    await expect(svg).toBeVisible();
    await expect(svg).toHaveAttribute("data-gn2-room",room);
    await expect(svg.locator("polygon.gn2-floor-walkable")).toHaveCount(1);
    await expect(svg.locator("polygon.gn2-floor-blocked").first()).toBeVisible();
    await expect(svg.locator(".gn2-floor-exit")).toHaveCount(1);
    await expect(root.getByRole("button",{name:"Di chuyển phải"})).toBeVisible();
    await page.screenshot({path:"test-results/world-v2-floormap-"+room+"-390.png",fullPage:true});
  }
});
test("kitchen table, fridge, stove and countertop get independent finite footprints",async({page})=>{
  const root=await openFloor(page,"bep");
  const svg=root.locator(".gn2-floor-review");
  const ids=await svg.locator("polygon[data-gn2-furniture]").evaluateAll(all=>all.map(el=>el.dataset.gn2Furniture));
  expect(ids.sort()).toEqual(["banan","bepnau","quaybep","tulanh"]);
  const actual=await page.evaluate(()=>({
    table:window.__GN_WORLD_V2__?.walking?.mode,
    floorVisible:!!document.querySelector(".gn2-floor-review"),
    tableClickable:document.querySelector('#v-bep [data-ri="banan"]')!==null
  }));
  expect(actual).toEqual({table:"local-preview",floorVisible:true,tableClickable:true});
  await root.getByRole("button",{name:"Bật bếp nấu"}).click();
  await expect(page.locator("#gn2-kitchen")).toBeVisible();
  await page.locator("#gn2-kitchen").getByRole("button",{name:/Đóng/}).click();
  await root.getByRole("link",{name:"Mở tủ lạnh nhắn nhủ"}).click();
  await expect(page.locator("#gn2-fridge")).toBeVisible();
});
test("floor overlay never catches floor taps, and scene room does not navigate away",async({page})=>{
  const root=await openFloor(page,"bep",430);
  const point=await root.locator(".wcanvas").first().evaluate(el=>{
    const r=el.getBoundingClientRect();
    return {x:r.left+205*r.width/1170,y:r.top+710*r.height/1170};
  });
  const hit=await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.closest(".gn2-floor-review")!==null,point);
  expect(hit).toBe(false);
  await page.mouse.click(point.x,point.y);
  expect(new URL(page.url()).hash).toBe("#bep");
});
test("down arrow steers around the physical kitchen table rather than freezing",async({page})=>{
  const root=await openFloor(page,"bep",390);
  const avatar=root.locator(".gn2-walk-avatar");
  const origin=await avatar.evaluate(el=>[Number(el.dataset.gn2X),Number(el.dataset.gn2Y)]);
  await root.getByRole("button",{name:"Di chuyển xuống"}).click();
  await expect.poll(async()=>Number(await avatar.getAttribute("data-gn2-y")),{timeout:7000})
    .toBeGreaterThan(origin[1]+55);
  const last=await avatar.evaluate(el=>[Number(el.dataset.gn2X),Number(el.dataset.gn2Y)]);
  expect(Math.abs(last[0]-origin[0])).toBeGreaterThan(25);
  const valid=await page.evaluate(async ([x,y])=>{
    const mod=await import("./src/living-world-nav.mjs");
    return mod.walkable("bep",[x,y]);
  },last);
  expect(valid).toBe(true);
  expect(new URL(page.url()).hash).toBe("#bep");
});
test("QA map fits mobile widths and is disabled by default and without V2",async({page})=>{
  for(const width of [360,390,430]){
    const root=await openFloor(page,"bep",width);
    const bounds=await root.locator(".w3fit").first().boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(-1);
    expect(bounds.x+bounds.width).toBeLessThanOrEqual(width+1);
    await page.screenshot({path:"test-results/world-v2-floormap-bep-"+width+".png",fullPage:true});
  }
  const root=await openFloor(page,"bep",390,false);
  await expect(root.locator("svg.gn2-floor-review")).toHaveCount(0);
  await page.goto("/index.html?floormap=1#bep");
  await expect(page.locator("svg.gn2-floor-review")).toHaveCount(0);
  expect(await page.evaluate(()=>window.__GN_WORLD_V2__)).toBeUndefined();
});
