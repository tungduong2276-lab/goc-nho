import {test,expect} from '@playwright/test';
const sections={
  'hom-nay':'Hẹn hò','nhat-ky':'Hẹn hò','bo-luat':'Hẹn hò',
  'khu-vuon':'Khu vườn','tu-lanh':'Gửi nhau','thu':'Gửi nhau','uoc-mo':'Gửi nhau',
  'truyen':'Chơi cùng','ve':'Chơi cùng','vuong-quoc':'Chơi cùng',
  'tu-dien':'Kỷ niệm','bao-tang':'Kỷ niệm','ban-do':'Kỷ niệm'
};
test('every non-house tab has a coherent spacious heading and retains navigation',async({page})=>{
  await page.goto('/#nha');
  await page.evaluate(()=>localStorage.setItem('hu-hen-ho-me','0'));
  for(const [tab,title] of Object.entries(sections)){
    await page.goto('/#'+tab);
    const view=page.locator('#v-'+tab);
    await expect(view).toBeVisible();
    await expect(view.locator(':scope > .section-intro h2')).toHaveText(title);
    await expect(page.locator('nav.tabs a[aria-current="page"]')).toHaveCount(1);
  }
});
