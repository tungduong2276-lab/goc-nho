import {test,expect} from "@playwright/test";

async function visitWorld(page, path="/index.html?world2=1#bep") {
  const errors=[];
  page.on("pageerror", e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem("hu-hen-ho-me","0"));
  await page.route("https://www.gstatic.com/**", route=>route.abort());
  await page.route("https://fonts.googleapis.com/**",route=>route.abort());
  await page.route("https://fonts.gstatic.com/**",route=>route.abort());
  await page.goto(path);
  await expect(page.locator("#v-bep")).toBeVisible();
  await expect(page.locator("#v-bep .room3d")).toBeVisible();
  await expect(page.locator(".gn2-fridge-toggle")).toBeVisible();
  expect(errors).toEqual([]);
  return errors;
}

test("V2 is opt-in: default app does not get experimental controls",async({page})=>{
  await page.route("https://www.gstatic.com/**", route=>route.abort());
  await page.goto("/index.html#bep");
  await expect(page.locator("#v-bep")).toBeVisible();
  await expect(page.locator(".gn2-fridge-toggle")).toHaveCount(0);
  expect(await page.evaluate(()=>window.__GN_WORLD_V2__)).toBeUndefined();
});

test("fridge stays in kitchen while opening papers and responding locally",async({page})=>{
  await visitWorld(page);
  const start=await page.evaluate(()=>localStorage.getItem("hu-hen-ho-v2"));
  await page.locator(".gn2-fridge-toggle").click();
  await expect(page.locator("#gn2-fridge")).toBeVisible();
  await expect(page.locator("#v-bep")).toBeVisible();
  await page.getByRole("button",{name:"✎ Dán một mẩu giấy"}).click();
  await page.locator("#gn2-fridge .gn2-editor textarea").fill("Đi uống trà sữa không? 🧋");
  await page.getByRole("button",{name:"Dán lên tủ",exact:true}).click();
  await expect(page.locator(".gn2-note-body")).toContainText("Đi uống trà sữa không?");
  await page.locator("#gn2-fridge .gn2-paper-reply textarea").fill("Có, đi thôi!");
  await page.getByRole("button",{name:"↗ Trả lời"}).click();
  await expect(page.locator("#gn2-fridge .gn2-reply")).toContainText("Có, đi thôi!");
  await page.getByRole("button",{name:"‹ Trở lại cửa tủ"}).click();
  await expect(page.locator("#gn2-fridge .gn2-note")).toContainText("Đi uống trà sữa không?");
  await page.getByRole("button",{name:"✕ Đóng"}).click();
  await expect(page.locator("#v-bep")).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem("hu-hen-ho-v2"))).toBe(start);
});

test("chat uses the same room and explicitly distinguishes offline demo",async({page})=>{
  await visitWorld(page);
  await page.locator(".gn2-chat-toggle").click();
  await expect(page.locator("#gn2-chat .gn2-status")).toContainText("KHÔNG gửi cho người kia");
  await page.locator("#gn2-chat .gn2-chat-form input").fill("Nhớ qua bếp nha 💞");
  await page.getByRole("button",{name:"Gửi",exact:true}).click();
  await expect(page.locator("#gn2-chat .gn2-chat-bubble")).toContainText("Nhớ qua bếp nha");
  await page.getByRole("button",{name:"✕ Đóng"}).click();
  await expect(page.locator("#v-bep")).toBeVisible();
});

test("V2 brings 24 challenges and 36 more stickers without duplicating IDs",async({page})=>{
  await visitWorld(page);
  const state=await page.evaluate(()=>{
    const all=GAMES.map(g=>g.n);
    return {metrics:window.__GN_GAMES_V2__,length:all.length,unique:new Set(all).size,
      stickerLabel:STK_NAME["gn2-otter"],timer:GAMES.find(g=>g.n===31).timer};
  });
  expect(state.metrics).toMatchObject({extraGames:24,extraStickers:36,penaltiesAdded:24,bonusesAdded:8});
  expect(state.length).toBe(state.unique);
  expect(state.stickerLabel).toBe("Rái cá ôm tim");
  expect(state.timer).toBe(15);
});

test("fridge close-up works on 360/390/430px screens",async({browser})=>{
  for(const width of [360,390,430]){
    const context=await browser.newContext({viewport:{width,height:844}});
    const page=await context.newPage();
    await visitWorld(page);
    await page.locator(".gn2-fridge-toggle").click();
    await expect(page.locator("#gn2-fridge")).toBeVisible();
    const bounds=await page.locator("#gn2-fridge").evaluate(el=>({
      left:el.getBoundingClientRect().left,
      right:el.getBoundingClientRect().right,
      vw:window.innerWidth
    }));
    expect(bounds.left).toBeGreaterThanOrEqual(-1);
    expect(bounds.right).toBeLessThanOrEqual(bounds.vw+1);
    await context.close();
  }
});
