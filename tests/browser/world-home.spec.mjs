import {test,expect} from '@playwright/test';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {WORLD_FEATURES} from '../../src/world-features.mjs';
test.describe.configure({timeout:180000});
async function open(page,width=390,hash=''){
 await page.setViewportSize({width,height:844});const errors=[],apiRequests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/firestore\.googleapis|firebaseio|identitytoolkit|securetoken/.test(r.url()))apiRequests.push(r.url());});
 await page.addInitScript(()=>{localStorage.setItem('hu-hen-ho-me','1');});
 for(const h of ['www.gstatic.com','fonts.googleapis.com','fonts.gstatic.com'])await page.route('https://'+h+'/**',r=>r.abort());
 await page.route('https://cdn.jsdelivr.net/npm/three@0.169.0/**',r=>{const p=new URL(r.request().url()).pathname.replace('/npm/three@0.169.0/','');r.fulfill({contentType:'text/javascript',body:readFileSync(resolve('node_modules/three',p))});});
 await page.goto('/index.html'+hash);const world=page.frameLocator('#world-frame');await expect(world.locator('#loading')).toHaveClass(/gone/,{timeout:90000});await expect(page.locator('#world-home-loading')).toBeHidden();
 await world.locator('#world').waitFor();const frame=page.frames().find(f=>f.url().includes('/nha3d/index.html'));
 const N=(method,...args)=>frame.evaluate(([method,args])=>window.__NHA3D__[method](...args),[method,args]);await N('pauseAI',true);
 return{world,frame,N,errors,apiRequests};
}
for(const width of [360,390,430])test('3D-only home opens tools on the same island and preserves the old data at '+width+'px',async({page})=>{
 const{world,frame,N,errors,apiRequests}=await open(page,width);
 await expect(page.locator('nav.tabs')).toBeHidden();await expect(page.locator('nav.subtabs:visible')).toHaveCount(0);await expect(page.locator('#world-surface')).toBeHidden();
 expect(new URL(frame.url()).searchParams.get('me')).toBe('em');expect(new URL(frame.url()).searchParams.get('cloud')).toBe('0');
 const initial=await page.evaluate(()=>({meta:JSON.stringify(S.meta),letters:JSON.stringify(S.letters),garden:JSON.stringify(S.care)}));
 // Walk to the actual fridge; its action opens the parent paper, without a second app iframe.
 await N('goScene','nha');await N('settle');await N('pauseAI',true);
 const fridge=(await N('layout')).items.find(i=>i.type==='tuLanh');await N('nearItem',fridge.uid);await N('tick',1);
 let hit;for(const f of [.5,.25,.75]){const p=await N('screenOfItem',fridge.uid,f);if(await N('pickAt',...p)===fridge.uid){hit=p;break;}}
 expect(hit).toBeTruthy();await world.locator('#world').click({position:{x:hit[0],y:hit[1]}});
 await world.getByRole('button',{name:'Xem giấy nhắn · dán giấy',exact:true}).click();await N('tick',12);
 await expect(page.locator('#world-surface-title')).toHaveText('Giấy nhắn trên tủ lạnh');await expect(page.locator('#v-tu-lanh')).toBeVisible();await expect(page.locator('iframe')).toHaveCount(1);
 const text=page.locator('#fr-text');await expect(text).toBeVisible();await text.fill('Giấy nhắn thử trên đảo');
 await page.evaluate(()=>rerender());await expect(page.locator('#fr-text')).toHaveValue('Giấy nhắn thử trên đảo');
 mkdirSync('test-results/world-home',{recursive:true});await page.screenshot({path:'test-results/world-home/fridge-'+width+'.png'});
 if(width===390){await page.locator('#frSend').click();await expect.poll(()=>page.evaluate(()=>Object.values(S.fridge).some(n=>n.text==='Giấy nhắn thử trên đảo'&&n.by===1))).toBe(true);await expect.poll(()=>N('appState').then(s=>s.fridge.count)).toBe(1);}
 await page.getByRole('button',{name:'Đóng đồ dùng, về đảo'}).click();await expect(page.locator('#world-surface')).toBeHidden();
 const after=await page.evaluate(()=>({meta:JSON.stringify(S.meta),letters:JSON.stringify(S.letters),garden:JSON.stringify(S.care)}));expect(after).toEqual(initial);
 // The account surface is available from the world guide, no return to a tabbed home.
 await world.getByRole('button',{name:'Bản đồ và đồ dùng trên đảo'}).click();await world.getByRole('button',{name:'Tài khoản và ngôi nhà · Sổ tay',exact:true}).click();
 await expect(page.locator('#settings')).toBeVisible();await expect(page.locator('nav.tabs')).toBeHidden();await page.getByRole('button',{name:'Đóng đồ dùng, về đảo'}).click();
 mkdirSync('test-results/world-home',{recursive:true});await page.screenshot({path:'test-results/world-home/island-'+width+'.png'});
 expect(errors).toEqual([]);expect(apiRequests).toEqual([]);
});
test('all former features are reachable as object tools; untrusted messages cannot change navigation',async({page})=>{
 const{frame,errors,apiRequests}=await open(page);
 for(const f of WORLD_FEATURES)await test.step(f.id,async()=>{await frame.evaluate(id=>parent.postMessage({type:'gocnho:open',id},location.origin),f.id);await expect(page.locator('#world-surface-title')).toHaveText(f.title);if(f.panel)await expect(page.locator('#'+f.panel)).toBeVisible();await expect(page.locator('nav.tabs')).toBeHidden();await page.getByRole('button',{name:'Đóng đồ dùng, về đảo'}).click();});
 await page.evaluate(()=>{window.postMessage({type:'gocnho:open',id:'settings'},location.origin);});await page.waitForTimeout(50);await expect(page.locator('#world-surface')).toBeHidden();
 await frame.evaluate(()=>parent.postMessage({type:'gocnho:open',id:'<script>'},location.origin));await page.waitForTimeout(50);await expect(page.locator('#world-surface')).toBeHidden();
 expect(errors).toEqual([]);expect(apiRequests).toEqual([]);
});
test('old deep links open a single object tool over 3D and login stays accessible',async({page})=>{
 await open(page,390,'#thu');await expect(page.locator('#world-surface-title')).toHaveText('Thư hẹn giờ');await expect(page.locator('nav.tabs')).toBeHidden();await page.getByRole('button',{name:'Đóng đồ dùng, về đảo'}).click();
 await page.evaluate(()=>showGate('login'));await expect(page.locator('#gForm')).toBeVisible();await expect(page.locator('#g-email')).toBeVisible();
 await page.evaluate(()=>hideGate());await expect(page.locator('#world-frame')).toBeVisible();
});
test('world guide walks through the house door before opening its object tool',async({page})=>{
 const{world,N,errors}=await open(page);expect(await N('scene')).toBe('san');
 await world.getByRole('button',{name:'Bản đồ và đồ dùng trên đảo'}).click();
 await world.getByRole('button',{name:'Giấy nhắn trên tủ lạnh · Tủ lạnh',exact:true}).click();
 await N('tick',15);await N('settle');await N('tick',15);
 await expect(page.locator('#world-surface-title')).toHaveText('Giấy nhắn trên tủ lạnh');expect(await N('scene')).toBe('nha');
 await page.getByRole('button',{name:'Đóng đồ dùng, về đảo'}).click();expect(await N('scene')).toBe('nha');expect(errors).toEqual([]);
});
