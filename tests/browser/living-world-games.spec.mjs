import {test,expect} from "@playwright/test";

async function openGames(page){
  const pageErrors=[];
  page.on("pageerror",e=>pageErrors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem("hu-hen-ho-me","0"));
  await page.route("https://www.gstatic.com/**",r=>r.abort());
  await page.route("https://fonts.googleapis.com/**",r=>r.abort());
  await page.route("https://fonts.gstatic.com/**",r=>r.abort());
  await page.goto("/index.html?world2=1#vuong-quoc");
  await expect(page.locator("#v-vuong-quoc")).toBeVisible();
  await expect(page.locator("[data-gn2-mini]")).toBeVisible();
  await page.getByRole("button",{name:"Mở bàn game 2 người"}).click();
  await expect(page.locator("#gn2-mini")).toBeVisible();
  expect(pageErrors).toEqual([]);
}
test("Hai nửa mật mã can be solved and replayed on one device",async({page})=>{
  await openGames(page);
  await page.getByRole("button",{name:/Hai nửa mật mã/}).click();
  const clues=await page.locator("#gn2-mini .gn2-code-cell").allTextContents();
  expect(clues).toHaveLength(4);
  await page.getByRole("button",{name:/Đã nhớ/}).click();
  for(const clue of clues){
    const key=page.locator("#gn2-mini .gn2-mini-keys button").filter({hasText:clue});
    await expect(key).toHaveCount(1);
    await key.click();
  }
  await page.getByRole("button",{name:"Thử mở khóa"}).click();
  await expect(page.locator("#gn2-mini")).toContainText("Cửa bí mật đã mở");
  await page.getByRole("button",{name:/Chơi lại màn mới/}).click();
  await expect(page.locator("#gn2-mini .gn2-code-cell")).toHaveCount(4);
});
test("Trùng sóng does not show A choice during handoff, and reveals after B",async({page})=>{
  await openGames(page);
  await page.getByRole("button",{name:/Trùng sóng/}).click();
  const first=page.locator("#gn2-mini .gn2-mini-options button").first();
  const firstText=await first.textContent();
  await first.click();
  await expect(page.locator("#gn2-mini")).toContainText("Đã khóa câu trả lời của A");
  await expect(page.locator("#gn2-mini .gn2-mini-reveal")).toHaveCount(0);
  await page.getByRole("button",{name:"Đến lượt B"}).click();
  await page.locator("#gn2-mini .gn2-mini-options button").first().click();
  await expect(page.locator("#gn2-mini .gn2-mini-reveal")).toHaveCount(2);
  await expect(page.locator("#gn2-mini .gn2-mini-reveal").first()).toContainText(firstText);
  await page.getByRole("button",{name:/Chơi vòng khác/}).click();
  await expect(page.locator("#gn2-mini .gn2-mini-options button")).toHaveCount(4);
});
