import { test,expect } from "@playwright/test";
import { existsSync,readFileSync } from "node:fs";
import { resolve } from "node:path";

test.describe.configure({timeout:120000});
const THREE_DIR=resolve("node_modules/three");
test("hai người vẽ trực tiếp một canvas, tranh vào bảo tàng và truyện lên kệ ngủ",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const errors=[],firebase=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("request",req=>{if(/firestore\.googleapis|firebaseio|identitytoolkit|securetoken/.test(req.url()))firebase.push(req.url());});
  await page.route("https://www.gstatic.com/**",route=>route.abort());
  await page.route("https://fonts.googleapis.com/**",route=>route.abort());
  await page.route("https://fonts.gstatic.com/**",route=>route.abort());
  if(existsSync(THREE_DIR))await page.route("https://cdn.jsdelivr.net/npm/three@0.169.0/**",route=>{
    const rel=new URL(route.request().url()).pathname.replace("/npm/three@0.169.0/","");
    route.fulfill({contentType:"text/javascript",body:readFileSync(resolve(THREE_DIR,rel))});
  });
  await page.goto("/nha3d/index.html?scene=xuong&host=1&cloud=0");
  await page.waitForFunction(()=>window.__NHA3D__?.ready,null,{timeout:90000});
  const N=(method,...args)=>page.evaluate(([m,a])=>window.__NHA3D__[m](...a),[method,args]);
  const paint=async(offset=0)=>{
    const cv=page.locator(".creative-canvas");await cv.scrollIntoViewIfNeeded();
    const b=await cv.boundingBox();
    await page.mouse.move(b.x+b.width*.2,b.y+b.height*(.3+offset));
    await page.mouse.down();
    await page.mouse.move(b.x+b.width*.65,b.y+b.height*(.7+offset),{steps:5});
    await page.mouse.up();
  };

  await N("openCreative","paint");
  await expect(page.locator("#creative-sheet")).toBeVisible();
  await expect(page.locator(".creative-sync")).toContainText("Bản chơi trên máy này");
  await page.locator("#creative-new-art").fill("Ngôi nhà ba màu");
  await page.getByRole("button",{name:/Mở giá vẽ chung/}).click();
  expect(await N("creativeEasel")).toBe(1);
  await paint();
  await expect.poll(async()=>(await N("creative")).painting?.anh.length).toBeGreaterThan(0);
  const canvas=page.locator(".creative-canvas");
  const pixel=locator=>locator.evaluate(c=>Array.from(c.getContext("2d").getImageData(96,96,1,1).data));
  await expect.poll(()=>pixel(canvas)).toEqual([29,43,79,255]);
  await page.getByRole("button",{name:"Tẩy",exact:true}).click();
  await canvas.scrollIntoViewIfNeeded();
  const bounds=await canvas.boundingBox();
  await page.mouse.click(bounds.x+bounds.width*.2,bounds.y+bounds.height*.3);
  await expect.poll(()=>pixel(canvas)).toEqual([255,254,250,255]);
  await expect.poll(async()=>(await N("creative")).painting?.anh.at(-1)?.erase).toBe(true);
  await page.getByRole("button",{name:"Tẩy",exact:true}).click();
  await page.locator(".creative-close").click();

  await page.locator("#btn-me").click();
  await N("openCreative","paint");
  await paint(.1);
  await expect.poll(async()=>(await N("creative")).painting?.em.length).toBeGreaterThan(0);
  expect(await N("creativeEasel")).toBe(1);
  await expect(page.locator("#creative-publish")).toBeEnabled();
  await page.locator("#creative-publish").click();
  await expect.poll(async()=>(await N("creative")).artworks.length).toBe(1);
  await N("goScene","bao-tang");await N("settle");
  await N("openCreative","museum");
  await expect(page.locator("#creative-sheet")).toContainText("Ngôi nhà ba màu");
  await expect(page.locator(".creative-gallery canvas")).toBeVisible();
  await expect.poll(()=>pixel(page.locator(".creative-gallery canvas"))).toEqual([255,254,250,255]);
  await page.locator(".creative-close").click();

  await N("goScene","xuong");await N("settle");
  await N("openCreative","story");
  await page.locator("#creative-new-book").fill("Miu và căn nhà bé xíu");
  await page.getByRole("button",{name:/Mở cuốn truyện chung/}).click();
  await page.locator("#creative-story-draft").fill("Miu mở cửa bước vào một khu vườn.");
  await expect.poll(async()=>(await N("creative")).story?.drafts.em).toContain("Miu mở cửa");
  await page.getByRole("button",{name:/Ghi đoạn văn vào truyện/}).click();
  await expect.poll(async()=>(await N("creative")).story?.lines.length).toBe(1);
  await page.locator(".creative-close").click();

  await page.locator("#btn-me").click();
  await N("openCreative","story");
  await page.locator("#creative-story-draft").fill("Anh đợi Miu bên hồ cá xanh.");
  await page.getByRole("button",{name:/Ghi đoạn văn vào truyện/}).click();
  await expect(page.locator("#creative-publish-book")).toBeEnabled();
  await page.locator("#creative-publish-book").click();
  await expect.poll(async()=>(await N("creative")).books.length).toBe(1);
  await N("goScene","ngu");await N("settle");
  expect((await N("layout")).items.some(i=>i.uid==="bed-story-books")).toBe(true);
  await N("openCreative","books");
  await expect(page.locator("#creative-sheet")).toContainText("Miu và căn nhà bé xíu");
  await expect(page.locator(".creative-book")).toContainText("Anh đợi Miu bên hồ cá xanh");
  expect(errors).toEqual([]);expect(firebase).toEqual([]);
});
