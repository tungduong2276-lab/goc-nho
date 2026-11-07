import {test,expect} from '@playwright/test';

async function openWorld(page, room, width=390) {
  await page.setViewportSize({width,height:844});
  await page.goto('/?world2=1#'+room);
  await page.evaluate(()=>localStorage.setItem('hu-hen-ho-me','0'));
  await page.reload();
  const root=page.locator('#v-'+room);
  await expect(root).toBeVisible();
  await expect(root.locator('.gn2-walk-toolbar')).toBeVisible({timeout:15000});
  await expect(root.locator('.gn2-walk-avatar')).toHaveCount(1);
  return root;
}
test('opt-in kitchen allows walk controls, flower emote and no legacy Firebase mutations',async({page})=>{
  const root=await openWorld(page,'bep');
  const avatar=root.locator('.gn2-walk-avatar');
  const initial=Number(await avatar.getAttribute('data-gn2-y'));
  await root.getByRole('button',{name:'Di chuyển xuống'}).click();
  await expect.poll(async()=>Number(await avatar.getAttribute('data-gn2-y')),{timeout:5000})
    .toBeGreaterThan(initial+55);
  await root.getByRole('button',{name:'Biểu cảm 🌸'}).click();
  await expect(root.locator('.gn2-walk-bubble')).toHaveText('🌸');
  expect(await page.evaluate(()=>window.__GN_WORLD_V2__?.walking?.mode)).toBe('local-preview');
  expect(await page.evaluate(()=>window.__GN_WORLD_V2__?.experimental)).toBe(true);
});
test('tapping a walkable point moves the local avatar without navigation',async({page})=>{
  const root=await openWorld(page,'bep',430);
  const canvas=root.locator('.wcanvas');
  const box=await canvas.boundingBox();
  expect(box).not.toBeNull();
  const x=box.x+420*box.width/1170,y=box.y+715*box.height/1170;
  await page.mouse.click(x,y);
  await expect.poll(async()=>Number(await root.locator('.gn2-walk-avatar').getAttribute('data-gn2-x')),{timeout:6000})
    .toBeLessThan(435);
  expect(new URL(page.url()).hash).toBe('#bep');
});
test('seven existing rooms keep a walk toolbar on narrow screens',async({page})=>{
  for(const room of ['phong-khach','bep','phong-anh','phong-em','goc-sang-tao','gac','khu-vuon']){
    const root=await openWorld(page,room,360);
    await expect(root.getByRole('button',{name:'Di chuyển phải'})).toBeVisible();
    await expect(root.getByRole('button',{name:'Biểu cảm 🥰'})).toBeVisible();
    expect(await root.evaluate(el=>el.scrollWidth)).toBeLessThanOrEqual(360+1);
    await page.screenshot({path:'test-results/world-v2-walk-'+room+'-360.png',fullPage:true});
  }
});
test('world movement opt-out keeps original page untouched',async({page})=>{
  await page.goto('/#bep');
  await page.evaluate(()=>localStorage.setItem('hu-hen-ho-me','0'));
  await page.reload();
  await expect(page.locator('#v-bep')).toBeVisible();
  await expect(page.locator('.gn2-walk-toolbar')).toHaveCount(0);
  expect(await page.evaluate(()=>window.__GN_WORLD_V2__)).toBeUndefined();
});
