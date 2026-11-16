import {featureOf,featureFromHash,worldUrl,validWorldMessage} from './world-features.mjs';
if(document.documentElement.classList.contains('world-only'))mountWorldHome(window.GOCNHO_WORLD);
export function mountWorldHome(api){
 const home=document.createElement('main');home.id='world-home';home.setAttribute('aria-label','Thế giới của hai đứa');
 const frame=document.createElement('iframe');frame.id='world-frame';frame.title='Đảo 3D của hai đứa';home.append(frame);document.body.append(home);
 const loading=document.createElement('div');loading.id='world-home-loading';const loadText=document.createElement('p');loadText.textContent='Đang mở đảo của hai đứa…';const retry=document.createElement('button');retry.className='btn btn-main';retry.textContent='Tải lại đảo';retry.onclick=()=>location.reload();loading.append(loadText,retry);home.append(loading);
 const veil=document.createElement('div');veil.id='world-veil';veil.hidden=true;document.body.append(veil);
 const surface=document.createElement('section');surface.id='world-surface';surface.hidden=true;surface.setAttribute('role','dialog');surface.setAttribute('aria-modal','true');surface.setAttribute('aria-labelledby','world-surface-title');
 const head=document.createElement('header');head.id='world-surface-head';const title=document.createElement('h2');title.id='world-surface-title';const close=document.createElement('button');close.id='world-surface-close';close.className='btn btn-ghost';close.textContent='Về đảo';close.setAttribute('aria-label','Đóng đồ dùng, về đảo');head.append(title,close);
 const app=document.getElementById('app');surface.append(head,app);document.body.append(surface);
 const syncBox=document.getElementById('syncBox');syncBox.classList.add('world-sync');syncBox.setAttribute('role','button');syncBox.tabIndex=0;syncBox.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();syncBox.click();}});
 const placeSync=()=>{syncBox.classList.toggle('world-sync-floating',surface.hidden);if(surface.hidden)home.append(syncBox);else surface.insertBefore(syncBox,app);};placeSync();
 let identityKey=null,active=null,loaded=false,timer;
 const send=data=>frame.contentWindow?.postMessage(data,location.origin);
 const sendSurface=()=>send({type:'gocnho:surface',open:!surface.hidden||document.body.classList.contains('gated'),bottom:surface.hidden?0:Math.max(0,surface.getBoundingClientRect().bottom-frame.getBoundingClientRect().top)});
 function sync(){const user=api.user(),key=user.key+'|'+user.who+'|'+user.cloud;if(key!==identityKey){identityKey=key;loaded=false;loading.hidden=false;frame.src=worldUrl(location.href,user).href;clearTimeout(timer);timer=setTimeout(()=>{if(!loaded)loadText.textContent='Đảo chưa tải xong. Kiểm tra kết nối rồi tải lại nhé.';},25000);}send({type:'gocnho:user',who:user.who,names:user.names,avatars:user.avatars});sendSurface();if(active?.panel)selectPanel(active.panel);}
 function selectPanel(id){app.querySelectorAll('.world-selected-panel').forEach(e=>e.classList.remove('world-selected-panel'));document.getElementById(id)?.classList.add('world-selected-panel');}
 function open(id){const f=featureOf(id);if(!f)return;
  const user=api.user();if(!user.known&&id!=='settings'&&!document.body.classList.contains('gated')){
   surface.hidden=false;veil.hidden=false;placeSync();frame.inert=true;title.textContent='Ai đang ở trên đảo?';app.hidden=true;
   let box=document.getElementById('world-identity');if(!box){box=document.createElement('div');box.id='world-identity';surface.append(box);}box.replaceChildren();
   for(const who of ['anh','em']){const button=document.createElement('button');button.className='btn btn-main';button.textContent=user.names[user.avatars.indexOf(who)]||who;button.onclick=()=>{api.select(who);box.remove();app.hidden=false;open(id);};box.append(button);}close.focus();return;
  }active=f;surface.dataset.feature=f.id;if(f.panel)surface.dataset.panel=f.panel;else delete surface.dataset.panel;document.getElementById('world-identity')?.remove();app.hidden=false;title.textContent=f.title;surface.hidden=false;veil.hidden=false;placeSync();frame.inert=true;sendSurface();
  api.open(f);if(f.panel)selectPanel(f.panel);app.scrollTop=0;close.focus({preventScroll:true});
 }
 function end(){if(surface.hidden)return;active=null;api.close();surface.hidden=true;veil.hidden=true;placeSync();frame.inert=false;sendSurface();history.replaceState(null,'',location.pathname+location.search);frame.focus();}
 close.onclick=end;veil.onclick=end;
 surface.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();end();}if(e.key!=='Tab')return;const nodes=[...surface.querySelectorAll('button,a[href],input,textarea,select,summary,[tabindex="0"]')].filter(n=>!n.disabled&&n.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}});
 window.addEventListener('message',e=>{if(!validWorldMessage(e,frame.contentWindow,location.origin))return;const d=e.data;if(d.type==='gocnho:ready'){loaded=true;loading.hidden=true;clearTimeout(timer);sync();}else if(d.type==='gocnho:open')open(d.id);else if(d.type==='gocnho:who'&&(d.who==='anh'||d.who==='em'))api.select(d.who);});
 window.addEventListener('gocnho:state',sync);
 window.addEventListener('resize',sendSurface);new ResizeObserver(sendSurface).observe(surface);
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
 window.addEventListener('hashchange',()=>{const f=featureFromHash(location.hash);if(f)open(f.id);else if(active?.route!==location.hash.slice(1)&&!surface.hidden)end();});
 document.getElementById('closeSettings').addEventListener('click',end);
 document.getElementById('saveSettings').addEventListener('click',()=>{if(active?.id==='settings')end();sync();});
 sync();const linked=featureFromHash(location.hash);if(linked)open(linked.id);
 return {open,close:end};
}
