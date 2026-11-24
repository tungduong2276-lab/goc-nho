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
 await expect(page.locator('nav.tabs')).toBeHidden();await expect(page.locator('nav.subtabs:visible')).toHaveCount(0);await expect(page.locator('#world-surface')).toBeHidden();await expect(page.locator('#syncBox')).toBeVisible();
 expect(new URL(frame.url()).searchParams.get('me')).toBe('em');expect(new URL(frame.url()).searchParams.get('cloud')).toBe('0');
 const initial=await page.evaluate(()=>({meta:JSON.stringify(S.meta),letters:JSON.stringify(S.letters),garden:JSON.stringify(S.care)}));
 // Walk to the actual fridge; its action opens the parent paper, without a second app iframe.
 await N('goScene','nha');await N('settle');await N('pauseAI',true);
 const fridge=(await N('layout')).items.find(i=>i.type==='tuLanh');await N('nearItem',fridge.uid);await N('tick',1);
 let hit;for(const f of [.5,.25,.75]){const p=await N('screenOfItem',fridge.uid,f);if(await N('pickAt',...p)===fridge.uid){hit=p;break;}}
 expect(hit).toBeTruthy();await world.locator('#world').click({position:{x:hit[0],y:hit[1]}});
 await world.getByRole('button',{name:'Dán một mẩu giấy',exact:true}).click();await N('tick',12);
 await expect(page.locator('#world-surface-title')).toHaveText('Giấy nhắn trên tủ lạnh');await expect(page.locator('#v-tu-lanh')).toBeVisible();await expect(page.locator('#world-surface #syncBox')).toBeVisible();await expect(page.locator('iframe')).toHaveCount(1);
 await expect.poll(async()=>{const m=await N('me'),[,y]=await N('screenOfWorld',m.x,1.32,m.z),panel=await page.locator('#world-surface').boundingBox(),frameBox=await page.locator('#world-frame').boundingBox();return y+frameBox.y>panel.y+panel.height+4&&y+frameBox.y<704;}).toBe(true);
 const text=page.locator('#fr-text');await expect(text).toBeVisible();await text.fill('Giấy nhắn thử trên đảo');
 await page.evaluate(()=>rerender());await expect(page.locator('#fr-text')).toHaveValue('Giấy nhắn thử trên đảo');
 mkdirSync('test-results/world-home',{recursive:true});await page.screenshot({path:'test-results/world-home/fridge-'+width+'.png'});
 if(width===390){await page.locator('#frSend').click();await expect.poll(()=>page.evaluate(()=>Object.values(S.fridge).some(n=>n.text==='Giấy nhắn thử trên đảo'&&n.by===1))).toBe(true);await expect.poll(()=>N('appState').then(s=>s.fridge.count)).toBe(1);}
 await page.getByRole('button',{name:'Đóng đồ dùng, về đảo'}).click();await expect(page.locator('#world-surface')).toBeHidden();
 const after=await page.evaluate(()=>({meta:JSON.stringify(S.meta),letters:JSON.stringify(S.letters),garden:JSON.stringify(S.care)}));expect(after).toEqual(initial);
 // The account surface is available from the world guide, no return to a tabbed home.
 await world.getByRole('button',{name:'Bản đồ và đồ dùng trên đảo'}).click();await world.getByRole('button',{name:'Tài khoản và ngôi nhà · Sổ tay',exact:true}).click();
 await expect(page.locator('#settings')).toBeVisible();await expect(page.locator('nav.tabs')).toBeHidden();await page.getByRole('button',{name:'Đóng đồ dùng, về đảo'}).click();
 const sync=await page.locator('#syncBox').boundingBox();expect(sync.height).toBeGreaterThanOrEqual(44);
 for(const selector of ['#btn-world-guide','#btn-time','#btn-edit']){const control=world.locator(selector);if(await control.isVisible()){const box=await control.boundingBox();expect(sync.x+sync.width<=box.x||box.x+box.width<=sync.x||sync.y+sync.height<=box.y||box.y+box.height<=sync.y).toBe(true);}}
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
 await world.getByRole('button',{name:'Giấy nhắn trên tủ lạnh · Tủ lạnh · phòng bếp',exact:true}).click();
 // Từ sân qua phòng khách và hành lang tới tủ lạnh thật trong bếp.
 for(let k=0;k<8;k++){await N('tick',12);await N('settle');if(await page.locator('#world-surface-title').textContent()==='Giấy nhắn trên tủ lạnh'&&await page.locator('#world-surface').isVisible())break;}
 await expect(page.locator('#world-surface-title')).toHaveText('Giấy nhắn trên tủ lạnh');expect(await N('scene')).toBe('bep');
 await page.getByRole('button',{name:'Đóng đồ dùng, về đảo'}).click();expect(await N('scene')).toBe('bep');expect(errors).toEqual([]);
});

test('3D home keeps phone notch and home-indicator insets out of its controls and tool view',async({page})=>{
 const{world,frame,N,errors}=await open(page);await page.addStyleTag({content:'html.world-only{--world-safe-t:44px!important;--world-safe-b:34px!important}'});
 await expect.poll(async()=>(await page.locator('#world-frame').boundingBox()).y).toBe(44);await expect.poll(async()=>(await page.locator('#world-frame').boundingBox()).height).toBe(766);
 const sync=await page.locator('#syncBox').boundingBox(),compass=await world.locator('#btn-world-guide').boundingBox();expect(sync.y).toBeGreaterThanOrEqual(44);expect(compass.y).toBeGreaterThanOrEqual(44);
 await frame.evaluate(()=>parent.postMessage({type:'gocnho:open',id:'tu-lanh'},location.origin));await expect(page.locator('#fr-text')).toBeVisible();
 await expect.poll(async()=>{const m=await N('me'),[,y]=await N('screenOfWorld',m.x,1.32,m.z),panel=await page.locator('#world-surface').boundingBox(),box=await page.locator('#world-frame').boundingBox();return y+box.y>panel.y+panel.height+4&&y+box.y<700;}).toBe(true);
 await page.getByRole('button',{name:'Đóng đồ dùng, về đảo'}).click();expect(errors).toEqual([]);
});
test('typing keeps presence alive in the foreground and stops heartbeats when the app is hidden',async({page})=>{
 await page.clock.install();const{frame,errors,apiRequests}=await open(page);
 await frame.evaluate(()=>{
  window.presenceCalls=0;window.fakeHidden=false;
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.fakeHidden});
  window.__NHA3D__.useFakeCloud({uid:'synthetic-member',setPresence(){window.presenceCalls++;}});
  parent.postMessage({type:'gocnho:open',id:'tu-lanh'},location.origin);
 });
 await expect(page.locator('#fr-text')).toBeVisible();await page.clock.runFor(100);
 await frame.evaluate(()=>{window.fakeHidden=true;});const before=await frame.evaluate(()=>window.presenceCalls);
 await page.clock.runFor(16000);expect(await frame.evaluate(()=>window.presenceCalls)).toBe(before);
 await frame.evaluate(()=>{window.fakeHidden=false;});await page.clock.runFor(16000);
 expect(await frame.evaluate(()=>window.presenceCalls)).toBeGreaterThan(before);expect(errors).toEqual([]);expect(apiRequests).toEqual([]);
});

// Core objects played in the scene: read a note on the fridge door and heart it, open an envelope, shake the jar.
test('fridge notes, envelopes and the date jar work on the objects through the app\'s own handlers',async({page})=>{
 test.setTimeout(240000);
 await page.addInitScript(()=>{if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.setItem('v3-news-init','1');localStorage.setItem('hu-hen-ho-v2',JSON.stringify({
  meta:{names:['Anh','Em'],swaps:{},extraSwaps:{},pending:null,custom:[],startDate:'',bday:['','']},
  letters:{l1:{id:'l1',from:0,to:1,body:'Thư thử trên đảo',unlockSeason:null,unlockDate:'2020-01-01',date:'2026-11-01T00:00:00.000Z'},l2:{id:'l2',from:0,to:1,body:'Chưa mở',unlockSeason:null,unlockDate:'2099-01-01',date:'2026-11-02T00:00:00.000Z'}},
  fridge:{f1:{id:'f1',by:0,text:'Tối nay ăn lẩu nha',color:2,sticker:null,voice:null,dur:0,date:'2026-11-15T08:00:00.000Z',hearts:[false,false],replies:[]}},history:{}}));});
 const{world,frame,N,errors,apiRequests}=await open(page);
 const tapPart=async(uid,id)=>{await N('snapCam');const p=await N('screenOfPart',uid,id);expect(p).toBeTruthy();expect(await N('pickPart',...p)).toEqual(expect.objectContaining({id}));await world.locator('#world').click({position:{x:p[0],y:p[1]}});};
 // Fridge: the note itself is the button; its card shows the real text; heart uses the app's write.
 await N('goScene','nha');await N('settle');await N('pauseAI',true);
 const fridge=(await N('layout')).items.find(i=>i.type==='tuLanh');await N('nearItem',fridge.uid);await N('settle');await N('tick',2);await N('snapCam');
 expect(await N('partsOf',fridge.uid)).toEqual([{kind:'note',id:'f1'}]);
 await tapPart(fridge.uid,'f1');
 await expect(world.locator('#actions .card-body')).toHaveText('Tối nay ăn lẩu nha');await expect(world.locator('#actions .title')).toContainText('Giấy của Anh');
 await world.getByRole('button',{name:'💗 Thả tim',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>S.fridge.f1.hearts[1])).toBe(true);
 await expect.poll(()=>N('appState').then(s=>s.fridge.shown[0].mine)).toBe(true);
 await tapPart(fridge.uid,'f1');await world.getByRole('button',{name:'↩ Đáp lại',exact:true}).click();await N('tick',12);
 await expect(page.locator('#world-surface-title')).toHaveText('Giấy nhắn trên tủ lạnh');await expect(page.locator('#rep-f1')).toBeFocused();
 await page.getByRole('button',{name:'Đóng đồ dùng, về đảo'}).click();
 // Jar: shaking it draws through drawNow(); the slip's real name is shown in the scene.
 const jar=(await N('layout')).items.find(i=>i.type==='huHenHo');await N('nearItem',jar.uid);await N('settle');await N('tick',2);await N('snapCam');
 let hit;for(const f of [.5,.3,.7]){const p=await N('screenOfItem',jar.uid,f);if(await N('pickAt',...p)===jar.uid){hit=p;break;}}expect(hit).toBeTruthy();
 await world.locator('#world').click({position:{x:hit[0],y:hit[1]}});await world.getByRole('button',{name:'Lắc hũ, bốc một lá',exact:true}).click();await N('tick',12);
 await expect.poll(()=>page.evaluate(()=>!!S.meta.pending),{timeout:8000}).toBe(true);
 const name=await page.evaluate(()=>byN(S.meta.pending.n).name);
 await expect(world.locator('#actions .card-body')).toContainText(name,{timeout:8000});
 expect((await N('jarNames')).pending.name).toBe(name);
 // Mailbox: opening it lets envelopes out; the sealed one stays sealed, the open one goes to that letter.
 await N('goScene','san');await N('settle');await N('pauseAI',true);
 const box=(await N('layout')).items.find(i=>i.type==='hopThu');await N('nearItem',box.uid);await N('settle');await N('tick',2);await N('snapCam');
 let mp;for(const f of [.5,.35,.65,.2,.8]){const [x,y]=await N('screenOfItem',box.uid,f);for(const dx of [0,-6,6])if(!mp&&await N('pickAt',x+dx,y)===box.uid)mp=[x+dx,y];}expect(mp).toBeTruthy();
 await world.locator('#world').click({position:{x:mp[0],y:mp[1]}});await world.getByRole('button',{name:'Mở hộp thư (1 thư mới)',exact:true}).click();await N('tick',12);
 expect((await N('partsOf',box.uid)).map(p=>p.id).sort()).toEqual(['l1','l2']);
 await tapPart(box.uid,'l2');await expect(world.locator('#actions .title')).toContainText('còn niêm phong');await expect(world.getByRole('button',{name:/Bóc thư/})).toHaveCount(0);
 await tapPart(box.uid,'l1');await world.getByRole('button',{name:'💌 Bóc thư',exact:true}).click();await N('tick',12);
 await expect(page.locator('#world-surface-title')).toHaveText('Thư hẹn giờ');await expect(page.locator('#world-surface [data-focus-id="l1"]')).toContainText('Thư thử trên đảo');
 mkdirSync('test-results/world-home',{recursive:true});await page.screenshot({path:'test-results/world-home/letter-focus.png'});
 await page.getByRole('button',{name:'Đóng đồ dùng, về đảo'}).click();
 await expect.poll(()=>N('appState').then(s=>s.mail.unread)).toBe(0);
 // Untrusted or unknown actions are refused by the host.
 await frame.evaluate(()=>parent.postMessage({type:'gocnho:act',feature:'tu-lanh',action:'delete',id:'f1'},location.origin));await page.waitForTimeout(50);
 expect(await page.evaluate(()=>!!S.fridge.f1)).toBe(true);
 expect(errors).toEqual([]);expect(apiRequests).toEqual([]);
});
test('the date jar is played on the island: full slip card, play, open-date guidance, lost slip and host-authoritative state',async({page})=>{
 test.setTimeout(300000);
 await page.addInitScript(()=>{if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.setItem('v3-news-init','1');localStorage.setItem('hu-hen-ho-v2',JSON.stringify({
  meta:{names:['Anh','Em'],swaps:{},extraSwaps:{},pending:null,custom:[],startDate:'',bday:['','']},
  letters:{l1:{id:'l1',from:0,to:1,body:'Thư thử trên đảo',unlockSeason:null,unlockDate:'2020-01-01',date:'2026-11-01T00:00:00.000Z'},l2:{id:'l2',from:0,to:1,body:'Chưa mở',unlockSeason:null,unlockDate:'2099-01-01',date:'2026-11-02T00:00:00.000Z'}},
  fridge:{f1:{id:'f1',by:0,text:'Tối nay ăn lẩu nha',color:2,sticker:null,voice:null,dur:0,date:'2026-11-15T08:00:00.000Z',hearts:[false,false],replies:[]}},history:{}}));});
 const{world,frame,N,errors}=await open(page);
 await N('goScene','nha');await N('settle');await N('pauseAI',true);
 const jar=(await N('layout')).items.find(i=>i.type==='huHenHo');
 const tapJar=async()=>{await N('nearItem',jar.uid);await N('settle');await N('tick',2);await N('snapCam');let at=null;for(const f of [.5,.3,.7]){const p=await N('screenOfItem',jar.uid,f);if(await N('pickAt',...p)===jar.uid){at=p;break;}}expect(at).toBeTruthy();await world.locator('#world').click({position:{x:at[0],y:at[1]}});};
 await tapJar();await world.getByRole('button',{name:'Lắc hũ, bốc một lá',exact:true}).click();await N('tick',12);
 await expect.poll(()=>page.evaluate(()=>!!S.meta.pending),{timeout:8000}).toBe(true);
 await expect(world.locator('#actions .card-body')).toContainText(await page.evaluate(()=>byN(S.meta.pending.n).name),{timeout:8000});
 // The card shows how to play, and the slip can be played right on the jar through the app's own handler.
 const desc=await page.evaluate(()=>byN(S.meta.pending.n).desc);await expect(world.locator('#actions .card-body')).toContainText(desc.slice(0,30));
 mkdirSync('test-results/world-home',{recursive:true});await page.screenshot({path:'test-results/world-home/jar-card.png'});
 await world.getByRole('button',{name:'▶ Chơi lá này',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>!S.meta.pending&&!!openDate())).toBe(true);
 await expect.poll(()=>N('jarNames').then(j=>j.open&&j.open.no)).toBe(1);
 await N('tick',2);await expect(world.locator('#actions')).toBeHidden(); // the played slip's card must not come back
 await tapJar();await expect(world.getByRole('button',{name:'Buổi hẹn #1 đang diễn ra',exact:true})).toBeVisible();
 // A draw while a date is open is refused with a reason, and the jar opens the ritual instead of a dead end.
 await frame.evaluate(()=>parent.postMessage({type:'gocnho:act',feature:'hom-nay',action:'draw'},location.origin));
 await expect(page.locator('#world-surface-title')).toHaveText('Hũ hẹn hò',{timeout:8000});await expect(page.locator('#rituals')).toContainText('Buổi hẹn #1');
 await page.locator('#closeNoRate').click();await expect.poll(()=>page.evaluate(()=>!openDate())).toBe(true);
 await page.getByRole('button',{name:'Đóng đồ dùng, về đảo'}).click();
 // A waiting slip whose card no longer exists used to leave an empty screen; it can now be redrawn from the jar.
 await page.evaluate(()=>{S.meta.pending={id:'lostslip',n:999,aux:[],starter:0};rerender();});
 await expect.poll(()=>N('jarNames').then(j=>j.pending&&j.pending.lost)).toBe(true);
 await tapJar();await world.getByRole('button',{name:'Đọc lá đang chờ',exact:true}).click();await N('tick',12);
 await world.getByRole('button',{name:'🔄 Bốc lá khác',exact:true}).click();await N('tick',12);
 await expect.poll(()=>page.evaluate(()=>!!S.meta.pending&&!!byN(S.meta.pending.n)),{timeout:8000}).toBe(true);
 await expect(world.locator('#actions .card-body')).toContainText(await page.evaluate(()=>byN(S.meta.pending.n).name),{timeout:8000});
 // When the slip stops waiting (played on the other phone), its card on this island is put away.
 await page.evaluate(()=>{S.meta.pending=null;rerender();});await expect(world.locator('#actions')).toBeHidden();
 // The host app decides what the jar offers, even when the island's own copy of the data lags behind.
 await page.evaluate(()=>{S.history.hx={id:'hx',no:7,n:101,aux:[],starter:0,date:new Date().toISOString(),closed:false};rerender();});
 expect((await N('appState')).jar.openNo).toBe(null);
 await tapJar();await expect(world.getByRole('button',{name:'Buổi hẹn #7 đang diễn ra',exact:true})).toBeVisible();
 await page.evaluate(()=>{delete S.history.hx;rerender();});
 expect(errors).toEqual([]);
});

for(const width of [360,390,430])test('museum, photos, map, dictionary and promises are editable from 3D world at '+width+'px',async({page})=>{
  const {frame,errors,apiRequests}=await open(page,width);
  const cases=[
    {id:'bao-tang',type:'museum',primary:'name',fields:{name:'Hộp vé lưu niệm',note:'Chúng mình giữ vé này từ ngày đầu tiên'}},
    {id:'ban-do',type:'places',primary:'nick',fields:{real:'Quảng trường Lam Sơn',nick:'Góc hẹn đầu tiên',note:'Cùng nhau ngắm hoàng hôn'}},
    {id:'tu-dien',type:'dict',primary:'w',fields:{w:'Mây nhỏ',m:'Lời gọi bí mật của hai đứa'}},
    {id:'bo-luat',type:'rules',primary:'rule',fields:{rule:'Mỗi tuần cùng nấu một món mới',note:'Lời hứa chung'}}
  ];
  for(const item of cases)await test.step(item.type,async()=>{
    await frame.evaluate(id=>parent.postMessage({type:'gocnho:open',id},location.origin),item.id);
    await expect(page.locator('#world-surface-title')).toBeVisible();
    const root=page.locator('#tab-'+item.type);
    const add=root.locator('[data-tnew="'+item.type+'"]');
    await expect(add).toBeVisible();
    // The world host can rerender during async state snapshots; wait for a stable button rectangle.
    await expect.poll(async()=>{const b=await add.boundingBox();return b?.width||0;},{timeout:15000}).toBeGreaterThan(44);
    await add.click();
    const form=root.locator('form[data-type="'+item.type+'"]');
    await expect(form).toBeVisible();
    for(const [key,value]of Object.entries(item.fields))await page.locator('#tab-'+item.type+'-'+key).fill(value);
    if(item.type==='museum'){
      // The upload is on this form; photos must not be a display-only ornament.
      const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAJ8V9RUAAAAASUVORK5CYII=','base64');
      await form.locator('input[data-addph="tab-museum"]').setInputFiles({name:'memory.png',mimeType:'image/png',buffer:png});
      await expect(form.locator('#tab-museum-photos img')).toHaveCount(1);
    }
    await form.locator('button.btn-main').click();
    await expect.poll(()=>page.evaluate(({type,key,value})=>Object.values(S[type]).some(e=>e[key]===value),{type:item.type,key:item.primary,value:item.fields[item.primary]})).toBe(true);
    if(item.type==='museum'){
      await expect(root.locator('.exhibit img')).toHaveCount(1);
      await page.evaluate(()=>document.documentElement.dataset.theme='dark');
      const c=await root.locator('.exhibit .note').evaluate(el=>getComputedStyle(el).color);
      expect(c).toBe('rgb(234, 244, 255)'); // pale caption on dark navy, never burgundy.
      await page.evaluate(()=>document.documentElement.dataset.theme='light');
    }
    await page.getByRole('button',{name:'Đóng đồ dùng, về đảo'}).click();
    await frame.evaluate(id=>parent.postMessage({type:'gocnho:open',id},location.origin),item.id);
    await expect(root.locator('[data-tnew="'+item.type+'"]')).toBeVisible();
    await expect(root).toContainText(item.fields[item.primary]);
    await page.getByRole('button',{name:'Đóng đồ dùng, về đảo'}).click();
  });
  await page.reload();
  await expect(page.locator('#world-home-loading')).toBeHidden({timeout:90000});
  const saved=await page.evaluate(()=>({museum:Object.values(S.museum).some(x=>x.name==='Hộp vé lưu niệm'&&x.photos?.length),places:Object.values(S.places).some(x=>x.nick==='Góc hẹn đầu tiên')}));
  expect(saved.museum).toBeTruthy();expect(saved.places).toBe(true);
  expect(errors).toEqual([]);expect(apiRequests).toEqual([]);
});

test('date journal offers an honest path to add a new photo memory',async({page})=>{
 const {frame,errors}=await open(page,390);
 await frame.evaluate(()=>parent.postMessage({type:'gocnho:open',id:'nhat-ky'},location.origin));
 await expect(page.locator('#world-surface-title')).toHaveText('Sổ những buổi hẹn');
 const link=page.getByRole('link',{name:'Ghi kỷ niệm và thêm ảnh vào Bảo tàng'});
 await expect(link).toBeVisible();
 await link.click();
 await expect(page.locator('#world-surface-title')).toHaveText('Kỷ vật của hai đứa');
 await expect(page.locator('#tab-museum [data-tnew="museum"]')).toBeVisible();
 expect(errors).toEqual([]);
});

test('the shared date jar can reroll repeatedly and manage cards without changing history',async({page})=>{
 await page.addInitScript(()=>{
  if(sessionStorage.getItem('jar-seeded'))return;
  sessionStorage.setItem('jar-seeded','1');
  localStorage.setItem('hu-hen-ho-v2',JSON.stringify({
   meta:{pending:{id:'pick',n:101,aux:[],starter:0},swaps:{1:99}},
   history:{previous:{id:'previous',n:101,no:1,aux:[],starter:0,closed:true,date:'2026-11-01T00:00:00.000Z'}}
  }));
 });
 const {N,errors,apiRequests}=await open(page,360,'#hom-nay');
 await expect(page.locator('#world-surface-title')).toHaveText('Hũ hẹn hò');
 const history=await page.evaluate(()=>JSON.stringify(S.history));
 for(let i=0;i<4;i++){
  const previous=await page.evaluate(()=>S.meta.pending.n);
  await page.locator('#swapBtn').click();
  expect(await page.evaluate(()=>S.meta.pending.n)).not.toBe(previous);
 }
 expect(await page.evaluate(()=>S.meta.swaps[1])).toBe(99);
 await page.getByText('Quản lý lá trong hũ',{exact:true}).click();
 await page.getByLabel('Tên lá',{exact:true}).fill('Cùng gấp một chiếc thuyền');
 await page.getByLabel('Cách chơi',{exact:true}).fill('Mỗi người gấp một nửa.');
 await page.getByRole('button',{name:'Thêm lá vào hũ',exact:true}).click();
 expect(await page.evaluate(()=>jarGames().some(g=>g.name==='Cùng gấp một chiếc thuyền'))).toBe(true);
 const current=await page.evaluate(()=>byN(S.meta.pending.n).name);
 await page.getByRole('button',{name:'Bỏ lá '+current,exact:true}).click();
 await expect(page.locator('#result')).toContainText('Lá này không còn trong hũ');
 await expect.poll(()=>N('jarNames').then(j=>j.pending?.lost)).toBe(true);
 await page.getByRole('button',{name:'Khôi phục lá '+current,exact:true}).click();
 await expect(page.locator('#swapBtn')).toBeVisible();
 await page.getByRole('button',{name:'Bỏ lá Cùng gấp một chiếc thuyền',exact:true}).click();
 await page.reload();
 await page.getByText('Quản lý lá trong hũ',{exact:true}).click();
 await expect(page.getByRole('button',{name:'Khôi phục lá Cùng gấp một chiếc thuyền',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>JSON.stringify(S.history))).toBe(history);
 expect(errors).toEqual([]);expect(apiRequests).toEqual([]);
});


test('concurrent jar card additions and removals merge without losing either phone edit',async({page})=>{
 const{errors,apiRequests}=await open(page,390);
 const result=await page.evaluate(()=>{
   const base=structuredClone(S.meta),idA=jarCardId(GAMES[0]),idB=jarCardId(GAMES[1]);
   const n=Math.max(...allGames().map(g=>g.n))+1;
   const card=(cardId,name)=>({n,cardId,g:'dac',name,desc:'Kiểm thử độc lập',aux:[],by:0});
   const a={__base:base,custom:[card('card-fixture-a','Lá A')],
     jarRemoved:{...base.jarRemoved,[idA]:true}};
   const b={__base:base,custom:[card('card-fixture-b','Lá B')],
     jarRemoved:{...base.jarRemoved,[idB]:true}};
   const ab=mergeMetaForWrite(mergeMetaForWrite(base,a),b);
   const ba=mergeMetaForWrite(mergeMetaForWrite(base,b),a);
   const repeated=mergeMetaForWrite(ab,b);
   const inspect=x=>({
     removedA:x.jarRemoved[idA],removedB:x.jarRemoved[idB],
     names:x.custom.map(g=>g.name).sort(),
     uniqueNumbers:new Set(x.custom.map(g=>g.n)).size===x.custom.length,
     uniqueCards:new Set(x.custom.map(g=>g.cardId)).size===x.custom.length
   });
   return{ab:inspect(ab),ba:inspect(ba),repeated:inspect(repeated),
     repeatedCount:repeated.custom.length};
 });
 for(const key of ['ab','ba','repeated']){
   expect(result[key]).toEqual({
     removedA:true,removedB:true,names:['Lá A','Lá B'],
     uniqueNumbers:true,uniqueCards:true
   });
 }
 expect(result.repeatedCount).toBe(2);
 expect(errors).toEqual([]);expect(apiRequests).toEqual([]);
});
