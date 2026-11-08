import {test,expect} from '@playwright/test';

async function visitRoom(page,room='bep',width=390) {
  await page.setViewportSize({width,height:844});
  await page.addInitScript(()=>localStorage.setItem('hu-hen-ho-me','0'));
  await page.route('https://www.gstatic.com/**',route=>route.abort());
  await page.goto('/index.html?world2=1#'+room);
  const root=page.locator('#v-'+room);
  await expect(root).toBeVisible();
  await expect(root.locator('.gn2-chat-dock')).toBeVisible();
  await expect(root.locator('.gn2-chat-dock input')).toBeEnabled();
  return root;
}
test('in-room chat writes a speech bubble near the avatar and keeps the current kitchen scene',async({page})=>{
  const root=await visitRoom(page);
  const before=await page.evaluate(()=>localStorage.getItem('hu-hen-ho-v2'));
  await root.locator('.gn2-chat-dock input').fill('Ăn bánh rồi đi chơi nhé! 🍰');
  await root.getByRole('button',{name:'Gửi ngay'}).click();
  await expect(root.locator('.gn2-scene-speech')).toContainText('Ăn bánh rồi đi chơi nhé!');
  await expect(root.locator('.gn2-scene-speech')).toContainText('Anh');
  await expect(root.locator('.gn2-chat-dock-caption')).toContainText('chưa gửi sang điện thoại kia');
  expect(new URL(page.url()).hash).toBe('#bep');
  await expect(root.locator('.gn2-chat-dock input')).toHaveValue('');
  expect(await page.evaluate(()=>localStorage.getItem('hu-hen-ho-v2'))).toBe(before);
  await root.locator('.gn2-chat-toggle').click();
  await expect(page.locator('#gn2-chat .gn2-chat-bubble')).toContainText('Ăn bánh rồi đi chơi nhé!');
});
test('speech in one room does not appear in other rooms or leak into other room history',async({page})=>{
  const kitchen=await visitRoom(page);
  const entry=kitchen.locator('.gn2-chat-dock input');
  await entry.fill('Bí mật chỉ trong bếp 🌸');
  await entry.press('Enter');
  await expect(entry).toHaveValue('');
  // Test room separation against the durable modal history, not a speech
  // bubble that intentionally expires after a few seconds.
  await kitchen.locator('.gn2-chat-toggle').click();
  await expect(page.locator('#gn2-chat .gn2-chat-bubble')).toContainText('Bí mật chỉ trong bếp');
  await page.locator('#gn2-chat .gn2-close').click();
  // Navigate within the SAME app session; demoChat stays in memory, so this
  // genuinely checks room scoping rather than clearing history by reloading.
  await page.evaluate(()=>{location.hash='#phong-anh';});
  const room=page.locator('#v-phong-anh');
  await expect(room.locator('.gn2-chat-dock')).toBeVisible();
  await expect(room.locator('.gn2-scene-speech')).toHaveCount(0);
  await room.locator('.gn2-chat-toggle').click();
  await expect(page.locator('#gn2-chat .gn2-chat-bubble')).toHaveCount(0);
});
test('mobile dock and speech remain within 360/390/430 screens and support Enter key',async({page})=>{
  for(const width of [360,390,430]){
    const root=await visitRoom(page,'bep',width);
    const input=root.locator('.gn2-chat-dock input');
    const dock=root.locator('.gn2-chat-dock');
    // The chat field must come immediately after the room and BEFORE the
    // walking controls, not underneath the fixed bottom app navigation.
    await expect(root.locator('.room3d + .gn2-chat-dock + .gn2-walk-toolbar')).toHaveCount(1);
    const rect=await dock.boundingBox();
    expect(rect).not.toBeNull();
    expect(rect.x).toBeGreaterThanOrEqual(-1);
    expect(rect.x+rect.width).toBeLessThanOrEqual(width+1);
    expect(rect.y+rect.height).toBeLessThanOrEqual(844-55);
    await input.fill('Xin chào 🌷 '+width);
    await input.press('Enter');
    await expect(root.locator('.gn2-scene-speech')).toContainText('Xin chào');
    await page.screenshot({path:'test-results/world-v2-chat-bubble-'+width+'.png',fullPage:true});
  }
});
test('chat uses text nodes for HTML-like input, not interpolated markup',async({page})=>{
  const root=await visitRoom(page);
  const unsafe='<img src=x onerror=alert(1)> 🌷';
  const entry=root.locator('.gn2-chat-dock input');
  await entry.fill(unsafe);
  await entry.press('Enter');
  await expect(entry).toHaveValue('');
  // Chat history preserves the exact user text via textContent; a transient
  // 6-second bubble may have already expired while Playwright awaits.
  await root.locator('.gn2-chat-toggle').click();
  await expect(page.locator('#gn2-chat .gn2-chat-bubble')).toHaveText(unsafe);
  await expect(page.locator('#gn2-chat img')).toHaveCount(0);
  await expect(root.locator('.gn2-scene-speech img')).toHaveCount(0);
});
test('new scene chat is disabled when world2 flag is absent',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('hu-hen-ho-me','0'));
  await page.goto('/index.html#bep');
  await expect(page.locator('#v-bep')).toBeVisible();
  await expect(page.locator('.gn2-chat-dock')).toHaveCount(0);
  await expect(page.locator('.gn2-scene-speech')).toHaveCount(0);
});
