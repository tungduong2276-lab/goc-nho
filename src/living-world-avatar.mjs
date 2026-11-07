import {ROOM_NAV,walkable,walkPath} from "./living-world-nav.mjs";

/**
 * Góc Nhỏ V2: local 2.5D movement on the existing isometric room artwork.
 * Opt-in only, deliberately makes ZERO Firebase writes.
 * Room polygons and blockers are reviewed prototypes, not final production navmesh.
 */
if (new URLSearchParams(location.search).get("world2")==="1" && window.__GN_WORLD_V2__) {
  const locators={
    "phong-khach":"phong-khach","bep":"bep","phong-anh":"phong-anh",
    "phong-em":"phong-em","goc-sang-tao":"goc-sang-tao",
    "gac":"gac","khu-vuon":"khu-vuon"
  };
  const sceneKeys={"phong-anh":"phong_anh","phong-em":"phong_em",
    "goc-sang-tao":"sang_tao","khu-vuon":"khu_vuon"};
  const cache=new Map();
  let active=null,frame=0,lastTime=0;
  const prefersReduced=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const vector=(x,y)=>[x,y];
  function locationRoom(){
    const slug=location.hash.slice(1);
    return Object.prototype.hasOwnProperty.call(locators,slug)?locators[slug]:null;
  }
  function currentCanvas(room){
    const root=document.getElementById("v-"+room);
    if(!root||root.hidden)return null;
    const scene=root.querySelector(room==="khu-vuon"?".garden3d":".room3d");
    if(!scene)return null;
    const canvas=scene.querySelector(".rstage .wcanvas");
    return canvas?{root,scene,canvas}:null;
  }
  function basePoint(room){
    const key=sceneKeys[room]||room;
    if(room==="phong-khach")return SC3?.room?.dung?.[0];
    return SC3?.rooms?.[key]?.spots?.dung?.[0];
  }
  function standingPose(room){
    if(room==="phong-khach")return typeof sits==="function"&&sits(ME);
    if(room==="khu-vuon")return typeof gSits==="function"&&gSits(ME);
    const id=sceneKeys[room]||room;
    return (id==="phong_anh"||id==="phong_em") && typeof stOf==="function" && stOf(ME)==="ngu";
  }
  function buildLocalAvatar(room,canvas,pt){
    const el=document.createElement("span");
    el.className="chr gn2-mobile-char";
    el.setAttribute("aria-hidden","true");
    const info=SC3?.rooms?.[sceneKeys[room]||room];
    const k=info?.ppm/SC3.rig.ppm*1.3;
    el.innerHTML=charStack(ME,"dung",pt,k,null);
    const label=document.createElement("span");
    label.className="ctag c-"+CH(ME);
    label.style.left=pt[0]+"px";label.style.top=(pt[1]+8)+"px";
    label.textContent=S.meta.names[ME]||(ME?"Em":"Anh");
    el.appendChild(label);canvas.appendChild(el);
    return el;
  }
  function findAvatar(room,canvas,pt){
    // The shared rooms render ME first. In the other partner's private room,
    // the existing sprite belongs to them, so construct a local-only own sprite.
    const key=sceneKeys[room]||room;
    const privateRoom=key==="phong_anh"||key==="phong_em";
    const foreign=privateRoom && roomOwner(key)!==ME;
    if(foreign)return buildLocalAvatar(room,canvas,pt);
    if(room==="khu-vuon")return canvas.querySelector('.chr[data-gchar="'+ME+'"]');
    if(room==="phong-khach")return canvas.querySelector('.chr[data-rme="1"]');
    return canvas.querySelector(".chr:not(.pet)");
  }
  function addToolbar(scene){
    const bar=document.createElement("div");bar.className="gn2-walk-toolbar";
    const words=document.createElement("span");words.className="gn2-walk-help";
    words.textContent="🐾 Chạm vùng sàn để đi lại · di chuyển thử trên máy này";
    bar.appendChild(words);
    const arrows=document.createElement("div");
    arrows.className="gn2-walk-arrows";arrows.setAttribute("role","group");
    arrows.setAttribute("aria-label","Điều khiển di chuyển");
    [["←",-1,0],["↑",0,-1],["↓",0,1],["→",1,0]].forEach(([text,dx,dy])=>{
      const b=document.createElement("button");b.type="button";b.textContent=text;
      b.className="gn2-walk-button";b.setAttribute("aria-label","Di chuyển "+({ "←":"trái","↑":"lên","↓":"xuống","→":"phải" }[text]));
      b.addEventListener("click",()=>{if(!active)return;moveTo([active.pos[0]+dx*68,active.pos[1]+dy*68]);});
      arrows.appendChild(b);
    });
    bar.appendChild(arrows);
    const feelings=document.createElement("div");feelings.className="gn2-walk-feelings";
    feelings.setAttribute("role","group");feelings.setAttribute("aria-label","Biểu cảm của nhân vật");
    for(const emoji of ["👋","🥰","🌸"]){
      const b=document.createElement("button");b.type="button";b.className="gn2-walk-button";
      b.textContent=emoji;b.setAttribute("aria-label","Biểu cảm "+emoji);
      b.addEventListener("click",()=>emote(emoji));
      feelings.appendChild(b);
    }
    bar.appendChild(feelings);
    scene.insertAdjacentElement("afterend",bar);
    return bar;
  }
  function applyPosition(a){
    if(!a?.avatar?.isConnected)return;
    const [x,y]=a.pos,[bx,by]=a.base;
    a.avatar.classList.add("gn2-walk-avatar");
    a.avatar.style.transform="translate3d("+(x-bx).toFixed(2)+"px,"+(y-by).toFixed(2)+"px,0)";
    a.avatar.style.zIndex=String(Math.round(y));
    a.avatar.dataset.gn2X=x.toFixed(1);a.avatar.dataset.gn2Y=y.toFixed(1);
    if(a.bubble){a.bubble.style.left=x+"px";a.bubble.style.top=(y-146)+"px";}
  }
  function emote(symbol){
    const a=active;if(!a || !a.canvas.isConnected)return;
    if(a.bubble)a.bubble.remove();
    const bubble=document.createElement("span");bubble.className="gn2-walk-bubble";
    bubble.textContent=symbol;bubble.setAttribute("role","status");
    bubble.setAttribute("aria-label","Biểu cảm "+symbol);
    a.canvas.appendChild(bubble);a.bubble=bubble;applyPosition(a);
    setTimeout(()=>{if(a.bubble===bubble)a.bubble=null;bubble.remove();},1700);
  }
  function stop(){
    if(frame)cancelAnimationFrame(frame);frame=0;lastTime=0;
    if(active)active.route=null;
  }
  function step(t){
    frame=0;
    const a=active;if(!a||!a.canvas.isConnected||!a.route)return;
    const dt=lastTime?Math.min(.05,(t-lastTime)/1000):.016;
    lastTime=t;let remaining=dt*190;
    while(remaining>0 && a.route.length>0){
      const next=a.route[0],dx=next[0]-a.pos[0],dy=next[1]-a.pos[1],distance=Math.hypot(dx,dy);
      if(distance<.5){a.pos=next.slice();a.route.shift();continue;}
      const advance=Math.min(remaining,distance);
      a.pos=[a.pos[0]+dx/distance*advance,a.pos[1]+dy/distance*advance];
      remaining-=advance;
      if(advance>=distance-.01){a.pos=next.slice();a.route.shift();}
    }
    cache.set(a.room,a.pos.slice());applyPosition(a);
    if(a.route.length)frame=requestAnimationFrame(step);
    else {a.route=null;lastTime=0;}
  }
  function moveTo(target){
    const a=active;if(!a||standingPose(a.room))return false;
    if(!walkable(a.room,target))return false;
    const path=walkPath(a.room,a.pos,target);
    if(!path)return false;
    stop();a.route=path.slice(1);lastTime=0;
    if(prefersReduced()){
      a.pos=target.slice();cache.set(a.room,a.pos.slice());a.route=null;applyPosition(a);
    }else frame=requestAnimationFrame(step);
    return true;
  }
  function blockedByInteractiveItem(canvas,event) {
    if(event.target.closest?.(".lay,.chr,.gn2-chat-toggle,.gn2-fridge-toggle"))return true;
    for(const el of canvas.querySelectorAll(".lay.hot")){
      const box=el.getBoundingClientRect();
      if(event.clientX<box.left||event.clientX>box.right||
         event.clientY<box.top||event.clientY>box.bottom)continue;
      const img=el.querySelector("img");
      if(!img) return true;
      const alpha=layAlpha(img,(event.clientX-box.left)/box.width,(event.clientY-box.top)/box.height);
      if(alpha===null||alpha>30)return true;
    }
    return false;
  }
  function onCanvasClick(event){
    const a=active;
    if(!a||event.currentTarget!==a.canvas||event.detail===0)return;
    if(blockedByInteractiveItem(a.canvas,event))return;
    const box=a.canvas.getBoundingClientRect();
    if(!box.width||!box.height)return;
    const target=[(event.clientX-box.left)*1170/box.width,
                  (event.clientY-box.top)*1170/box.height];
    moveTo(target);
  }
  function install(){
    if(!SC3||ME===null)return;
    const room=locationRoom();if(!room||!ROOM_NAV[room]){stop();active=null;return;}
    const parts=currentCanvas(room);
    if(!parts){stop();active=null;return;}
    if(active?.canvas===parts.canvas)return;
    stop();
    const base=basePoint(room);if(!base||!walkable(room,base))return;
    const avatar=findAvatar(room,parts.canvas,base);if(!avatar)return;
    const pos=cache.get(room);const safe=pos&&walkable(room,pos)?pos:base.slice();
    const bar=addToolbar(parts.scene);
    active={room,root:parts.root,scene:parts.scene,canvas:parts.canvas,avatar,
      base:base.slice(),pos:safe.slice(),route:null,bubble:null,bar};
    applyPosition(active);
    parts.canvas.addEventListener("click",onCanvasClick);
    window.__GN_WORLD_V2__.walking={mode:"local-preview",rooms:Object.keys(ROOM_NAV)};
  }
  let pending=false;
  function queueInstall(){
    if(pending)return;pending=true;
    requestAnimationFrame(()=>{pending=false;install();});
  }
  const observer=new MutationObserver(records=>{
    if(records.some(r=>r.addedNodes.length||r.removedNodes.length))queueInstall();
  });
  observer.observe(document.body,{subtree:true,childList:true});
  window.addEventListener("hashchange",queueInstall);
  document.addEventListener("keydown",event=>{
    if(!active||event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||
      document.activeElement?.matches("input,textarea,select,[contenteditable]")||
      document.querySelector("dialog[open]"))return;
    const dir={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
    if(!dir)return;
    const focused=document.activeElement;
    if(!focused?.closest(".gn2-walk-toolbar"))return;
    event.preventDefault();moveTo([active.pos[0]+dir[0]*68,active.pos[1]+dir[1]*68]);
  });
  queueInstall();
}
