import {test,expect} from '@playwright/test';

async function openKitchen(page,width=390) {
  await page.setViewportSize({width,height:844});
  await page.goto('/?world2=1#bep');
  await page.evaluate(()=>localStorage.setItem('hu-hen-ho-me','0'));
  await page.reload();
  const root=page.locator('#v-bep');
  await expect(root).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>window.__GN_KITCHEN_V2__?.mode),{timeout:15000})
    .toBe('local-pass-and-play');
  await expect(root.getByRole('button',{name:'Bật bếp nấu'})).toBeVisible();
  await root.getByRole('button',{name:'Bật bếp nấu'}).click();
  const dialog=page.locator('dialog#gn2-kitchen');
  await expect(dialog).toBeVisible();
  return {root,dialog};
}
async function cookOneRound(dialog) {
  const steps=await dialog.locator('[data-kitchen-step]').evaluateAll(elements=>
    elements.map(el=>({id:el.dataset.kitchenStep,heat:Number(el.dataset.heat)})));
  expect(steps).toHaveLength(3);
  await dialog.getByRole('button',{name:/Cất giấy/}).click();
  await expect(dialog.locator('[data-kitchen-step]')).toHaveCount(0);
  for(const step of steps){
    await dialog.locator('.gn2-kitchen-heat-button').nth(step.heat-1).click();
    await dialog.locator('[data-ingredient="'+step.id+'"]').click();
  }
  await expect(dialog.getByText('Món ăn ra lò!',{exact:false})).toBeVisible();
}
test('the physical stove opens a 2-role recipe game and leaves a visible dish on the table',async({page})=>{
  const {root,dialog}=await openKitchen(page);
  await expect(dialog.getByText('không gửi lên Firebase',{exact:false})).toBeVisible();
  await dialog.getByRole('button',{name:/Bắt đầu 2 vòng nấu/}).click();
  await cookOneRound(dialog);
  await expect(root.locator('.gn2-kitchen-plate')).toHaveCount(1);
  await dialog.getByRole('button',{name:/Nhìn món trên bàn/}).click();
  await expect(dialog).not.toBeVisible();
  await expect(root.locator('.gn2-kitchen-plate')).toBeVisible();
  await root.locator('.gn2-kitchen-plate').click();
  await expect(dialog.getByText('Bàn ăn của hai đứa')).toBeVisible();
  expect(new URL(page.url()).hash).toBe('#bep');
});
test('two successive cooking rounds swap roles, finish, and offer a replay',async({page})=>{
  const {dialog}=await openKitchen(page,430);
  await dialog.getByRole('button',{name:/Bắt đầu 2 vòng nấu/}).click();
  await expect(dialog.getByText('A dẫn — B nấu',{exact:false})).toBeVisible();
  await cookOneRound(dialog);
  await dialog.getByRole('button',{name:/Đổi vai/}).click();
  await expect(dialog.getByText('B dẫn — A nấu',{exact:false})).toBeVisible();
  await cookOneRound(dialog);
  await dialog.getByRole('button',{name:/Xem kết quả hai vòng/}).click();
  await expect(dialog.getByText('Tổng điểm 200/200',{exact:false})).toBeVisible();
  await dialog.getByRole('button',{name:/Bốc công thức mới và chơi lại/}).click();
  await expect(dialog.locator('[data-kitchen-step]')).toHaveCount(3);
});
test('three wrong ingredients make a funny dinner without trapping players',async({page})=>{
  const {root,dialog}=await openKitchen(page,360);
  await dialog.getByRole('button',{name:/Bắt đầu 2 vòng nấu/}).click();
  const answer=(await dialog.locator('[data-kitchen-step]').first().getAttribute('data-kitchen-step'));
  await dialog.getByRole('button',{name:/Cất giấy/}).click();
  const wrong=dialog.locator('[data-ingredient]').filter({hasNot:dialog.locator('[data-ingredient="'+answer+'"]')});
  // Choose a literal wrong ID from the visible button set to avoid any client-side answer leak.
  const ids=await dialog.locator('[data-ingredient]').evaluateAll(els=>els.map(e=>e.dataset.ingredient));
  const decoy=ids.find(x=>x!==answer);
  expect(decoy).toBeTruthy();
  for(let i=0;i<3;i++)await dialog.locator('[data-ingredient="'+decoy+'"]').click();
  await expect(dialog.getByText('Huyền thoại bếp khói hồng!',{exact:false})).toBeVisible();
  await expect(root.locator('.gn2-kitchen-plate')).toHaveCount(1);
  await expect(dialog.getByRole('button',{name:/Đổi vai/})).toBeVisible();
});
test('kitchen and fridge remain distinct physical objects on 360/390/430px',async({page})=>{
  for(const width of [360,390,430]){
    const {root,dialog}=await openKitchen(page,width);
    await expect(dialog.getByRole('button',{name:/Bắt đầu 2 vòng nấu/})).toBeVisible();
    const w=await dialog.evaluate(el=>el.getBoundingClientRect().width);
    expect(w).toBeLessThanOrEqual(width+1);
    await page.screenshot({path:'test-results/world-v2-kitchen-'+width+'.png',fullPage:true});
    await dialog.getByRole('button',{name:/Đóng/}).click();
    await root.locator('[data-ri="tulanh"]').first().click();
    await expect(page.locator('dialog#gn2-fridge')).toBeVisible();
    await page.locator('dialog#gn2-fridge').getByRole('button',{name:/Đóng/}).click();
    expect(new URL(page.url()).hash).toBe('#bep');
  }
});
test('without V2 flag no new kitchen module, object behavior or scene plate appears',async({page})=>{
  await page.goto('/#bep');
  await page.evaluate(()=>localStorage.setItem('hu-hen-ho-me','0'));
  await page.reload();
  await expect(page.locator('#v-bep')).toBeVisible();
  await expect(page.locator('dialog#gn2-kitchen')).toHaveCount(0);
  await expect(page.locator('.gn2-kitchen-plate')).toHaveCount(0);
  expect(await page.evaluate(()=>window.__GN_KITCHEN_V2__)).toBeUndefined();
});
