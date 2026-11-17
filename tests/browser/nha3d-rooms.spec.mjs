import { test, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const THREE_DIR=resolve("node_modules/three");
test.describe.configure({timeout:120_000});
async function openRoom(page,scene="nha",width=390){
  await page.setViewportSize({width,height:844});
  const errors=[],firebase=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("request",request=>{if(/firestore\.googleapis|firebaseio|identitytoolkit|securetoken/.test(request.url()))firebase.push(request.url());});
  await page.route("https://www.gstatic.com/**",route=>route.abort());
  if(existsSync(THREE_DIR))await page.route("https://cdn.jsdelivr.net/npm/three@0.169.0/**",route=>{
    const rel=new URL(route.request().url()).pathname.replace("/npm/three@0.169.0/","");
    route.fulfill({contentType:"text/javascript",body:readFileSync(resolve(THREE_DIR,rel))});
  });
  await page.route("https://fonts.googleapis.com/**",route=>route.abort());
  await page.route("https://fonts.gstatic.com/**",route=>route.abort());
  await page.goto("/nha3d/index.html?scene="+encodeURIComponent(scene));
  await page.waitForFunction(()=>window.__NHA3D__?.ready,null,{timeout:90_000});
  await page.evaluate(()=>window.__NHA3D__.pauseAI(true));
  return {errors,firebase};
}
const N=(page,fn,...args)=>page.evaluate(([fn,args])=>window.__NHA3D__[fn](...args),[fn,args]);
async function enterNear(page,x,z,name){
  await N(page,"teleport",x,z);
  await N(page,"snapCam");
  await expect(page.locator(".doortag")).toContainText(name,{timeout:10_000});
  await page.locator(".doortag").click();
  await N(page,"settle");
}
test("đi qua cửa thật từ phòng khách tới hành lang rồi bảo tàng",async({page})=>{
  const {errors,firebase}=await openRoom(page,"nha");
  const old=await N(page,"layout");
  expect(old.items.some(it=>it.uid==="b1"&&it.type==="giuong")).toBe(true);
  await enterNear(page,1.75,-2.35,"Hành lang");
  expect(await N(page,"scene")).toBe("hanh-lang");
  await enterNear(page,0,-3.65,"Bảo tàng");
  expect(await N(page,"scene")).toBe("bao-tang");
  const items=(await N(page,"layout")).items;
  expect(items.filter(it=>it.type==="tuKinh").length).toBe(3);
  await expect(page.locator("#btn-edit")).toBeVisible();
  await enterNear(page,0,3,"Hành lang");
  expect(await N(page,"scene")).toBe("hanh-lang");
  await enterNear(page,0,3.7,"Phòng khách");
  expect(await N(page,"scene")).toBe("nha");
  expect(await N(page,"layout")).toEqual(old);
  expect(errors).toEqual([]);
  expect(firebase).toEqual([]);
});
test("phòng ngủ, bếp và xưởng có bố cục độc lập; vào lại không mất đồ",async({page})=>{
  const {errors}=await openRoom(page,"ngu",360);
  expect((await N(page,"layout")).items.some(it=>it.type==="giuong")).toBe(true);
  await N(page,"goScene","bep");await N(page,"settle");
  expect((await N(page,"layout")).items.some(it=>it.type==="tuLanh")).toBe(true);
  await N(page,"goScene","xuong");await N(page,"settle");
  expect((await N(page,"layout")).items.some(it=>it.type==="giaVe")).toBe(true);
  await N(page,"goScene","bao-tang");await N(page,"settle");
  const museum=await N(page,"layout");
  await page.reload();
  await page.waitForFunction(()=>window.__NHA3D__?.ready,null,{timeout:90_000});
  expect((await N(page,"layout")).items.map(it=>it.uid)).toEqual(museum.items.map(it=>it.uid));
  expect((await N(page,"scene"))).toBe("ngu"); // URL ?scene=ngu vẫn ưu tiên hơn scene lưu
  expect(errors).toEqual([]);
});
