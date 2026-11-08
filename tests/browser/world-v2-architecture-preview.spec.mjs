import {test,expect} from "@playwright/test";

const roomIds=["phong-khach","bep","phong-anh","phong-em","goc-sang-tao","gac"];
async function openPreview(page,room="bep",width=390){
  await page.setViewportSize({width,height:844});
  await page.addInitScript(()=>localStorage.setItem("hu-hen-ho-me","0"));
  await page.goto("/index.html?world2=1&archpreview=1#"+room);
  await expect(page.locator("#v-"+room)).toBeVisible();
  const open=page.locator("#v-"+room).getByRole("button",{name:"🏠 Xem thử phòng 3D rộng hơn"});
  await expect(open).toBeVisible();
  await open.click();
  const dialog=page.locator("#gn2arch-preview");
  await expect(dialog).toBeVisible();
  const image=dialog.locator("img.gn2arch-picture");
  await expect(image).toHaveAttribute("data-gn2-loaded",
    "./assets/3d/v2arch/"+room+"_ngay.webp",{timeout:12000});
  await expect.poll(async()=>image.evaluate(el=>el.complete?el.naturalWidth:0)).toBe(1170);
  return {open,dialog,image};
}
test("real renderer WebPs for all six enlarged rooms and both light states load in the app",async({page})=>{
  const {dialog,image}=await openPreview(page);
  for(const id of roomIds){
    await dialog.locator('button[data-gn2-arch-room="'+id+'"]').click();
    for(const light of ["ngay","dem"]){
      const label=light==="ngay"?"☀️ Ban ngày":"🌙 Ban đêm";
      await dialog.getByRole("button",{name:label}).click();
      const src="./assets/3d/v2arch/"+id+"_"+light+".webp";
      await expect(image).toHaveAttribute("data-gn2-loaded",src,{timeout:12000});
      await expect(image).toHaveAttribute("src",src);
      await expect.poll(async()=>image.evaluate(el=>el.complete?el.naturalWidth:0)).toBe(1170);
      await expect.poll(async()=>image.evaluate(el=>el.complete?el.naturalHeight:0)).toBe(1170);
      await expect(dialog.locator(".gn2arch-image-status")).toBeHidden();
      await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      await dialog.screenshot({path:"test-results/world-v2-architecture-"+id+"-"+light+"-390.png"});
    }
  }
  await expect(dialog.locator(".gn2arch-tab")).toHaveCount(6);
});
test("floor/corridor inspection uses real projected pixels, never old room geometry",async({page})=>{
  const {dialog}=await openPreview(page,"gac");
  await dialog.getByRole("button",{name:"📐 Hiện kích thước"}).click();
  await expect(dialog.locator(".gn2arch-outline")).toHaveCount(1);
  await expect(dialog.locator(".gn2arch-walkline")).toHaveCount(1);
  await expect(dialog.locator(".gn2arch-marker-door")).toHaveCount(1);
  await expect(dialog.locator(".gn2arch-marker-furniture")).toHaveCount(4);
  const metadata=await page.evaluate(async()=>(
    await (await fetch("./assets/3d/v2arch/preview.json")).json()
  ).rooms.gac);
  const polygon=await dialog.locator(".gn2arch-outline").getAttribute("points");
  expect(polygon).toBe(metadata.floorCornersPixels.map(p=>p.join(",")).join(" "));
  const door=await dialog.locator(".gn2arch-marker-door").evaluate(
    el=>[Number(el.getAttribute("cx")),Number(el.getAttribute("cy"))]);
  expect(door).toEqual(metadata.doorway.floorPixels);
  expect(metadata.areaSqm).toBe(56);
  expect(metadata.originalAreaSqm).toBe(24);
  await dialog.screenshot({path:"test-results/world-v2-architecture-metrics-gac-390.png"});
});
test("rapid room switching only paints the last fully decoded bitmap, never a blank canvas",async({page})=>{
  const {dialog,image}=await openPreview(page,"bep");
  for(const id of ["gac","phong-anh","phong-em","goc-sang-tao","phong-khach"])
    await dialog.locator('button[data-gn2-arch-room="'+id+'"]').click();
  const final="./assets/3d/v2arch/phong-khach_ngay.webp";
  await expect(image).toHaveAttribute("data-gn2-loaded",final,{timeout:12000});
  await expect(image).toHaveAttribute("src",final);
  await expect(dialog.locator(".gn2arch-image-status")).toBeHidden();
  const pixel=await image.evaluate(async el=>{
    await el.decode();
    const canvas=document.createElement("canvas");
    canvas.width=400;canvas.height=400;
    const ctx=canvas.getContext("2d");
    ctx.drawImage(el,0,0,400,400);
    const p=ctx.getImageData(205,184,1,1).data;
    return [...p];
  });
  expect(pixel[3]).toBeGreaterThan(200);
  await dialog.screenshot({path:"test-results/world-v2-architecture-rapid-switch-390.png"});
});
test("existing room controls, kitchen game, and original furniture remain available after viewing",async({page})=>{
  const {dialog}=await openPreview(page,"bep");
  const furniture=page.locator('#v-bep .wcanvas [data-ri]');
  const before=await furniture.count();
  expect(before).toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  expect(new URL(page.url()).hash).toBe("#bep");
  expect(await furniture.count()).toBe(before);
  await page.locator("#v-bep").getByRole("button",{name:"Bật bếp nấu"}).click();
  await expect(page.locator("#gn2-kitchen")).toBeVisible();
  await page.locator("#gn2-kitchen").getByRole("button",{name:/Đóng/}).click();
  await page.locator("#v-bep").getByRole("link",{name:"Mở tủ lạnh nhắn nhủ"}).click();
  await expect(page.locator("#gn2-fridge")).toBeVisible();
});
test("preview is strictly opt-in and does not replace furniture or live rooms",async({page})=>{
  await page.addInitScript(()=>localStorage.setItem("hu-hen-ho-me","0"));
  await page.goto("/index.html?world2=1#bep");
  await expect(page.locator("#v-bep")).toBeVisible();
  await expect(page.locator(".gn2arch-entry")).toHaveCount(0);
  await expect(page.locator("#gn2arch-preview")).toHaveCount(0);
  await page.goto("/index.html?archpreview=1#bep");
  await expect(page.locator("#v-bep")).toBeVisible();
  await expect(page.locator(".gn2arch-entry")).toHaveCount(0);
  await expect(page.locator("#gn2arch-preview")).toHaveCount(0);
  expect(await page.evaluate(()=>window.__GN_WORLD_V2__)).toBeUndefined();
});
test("preview modal is usable on 360/390/430 px, escape and focus return reliably",async({page})=>{
  for(const width of [360,390,430]){
    const {open,dialog,image}=await openPreview(page,"phong-em",width);
    const box=await dialog.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x+box.width).toBeLessThanOrEqual(width+1);
    await dialog.getByRole("button",{name:"🌙 Ban đêm"}).click();
    await expect(image).toHaveAttribute("data-gn2-loaded",
      "./assets/3d/v2arch/phong-em_dem.webp",{timeout:12000});
    await expect.poll(async()=>image.evaluate(el=>el.complete?el.naturalWidth:0)).toBe(1170);
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    await dialog.screenshot({path:"test-results/world-v2-architecture-mobile-"+width+".png"});
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(open).toBeFocused();
  }
});
test("navigation away closes preview without corrupting 7-room legacy map",async({page})=>{
  const {dialog}=await openPreview(page,"bep");
  await page.evaluate(()=>location.hash="khu-vuon");
  await expect(page).toHaveURL(/#khu-vuon$/);
  await expect(dialog).not.toBeVisible();
  await expect(page.locator("#v-khu-vuon .gn2-walk-avatar")).toHaveCount(1);
  expect(await page.evaluate(()=>window.__GN_WORLD_V2__.architecturePreview.cloudWrites)).toBe(false);
});
test("multiple renderRooms while preview open leave exactly one gallery and one trigger",async({page})=>{
  const {dialog}=await openPreview(page);
  await page.evaluate(()=>{renderRooms();renderRooms();renderRooms();});
  await expect(dialog).toBeVisible();
  await expect(page.locator("#gn2arch-preview")).toHaveCount(1);
  await expect(page.locator("#v-bep .gn2arch-entry")).toHaveCount(1);
  await dialog.getByRole("button",{name:"Đóng bản xem thử kiến trúc"}).click();
  await expect(dialog).not.toBeVisible();
  await page.locator("#v-bep .gn2arch-entry").click();
  await expect(dialog).toBeVisible();
});
