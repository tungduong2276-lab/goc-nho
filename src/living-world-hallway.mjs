import {V2_DOORS,hallRoute} from "./living-world-transitions.mjs";

/**
 * Walkable common corridor. This is a local-stage visualization rather than
 * a claimed accurate architectural floor plan. Never persists anything.
 */
export function createHallway({onSelect}={}) {
  if(typeof onSelect!=="function")throw new TypeError("Corridor needs onSelect");
  const dialog=document.createElement("dialog");
  dialog.id="gn2-hall";
  dialog.className="gn2-hall-dialog";
  dialog.setAttribute("aria-label","Hành lang nối các phòng");
  const shell=document.createElement("div");
  shell.className="gn2-hall-shell";
  const head=document.createElement("header");
  head.className="gn2-hall-head";
  const heading=document.createElement("h2");
  heading.textContent="🏡 Hành lang của hai đứa";
  const help=document.createElement("p");
  help.textContent="Bước đến một cánh cửa để sang phòng. Đây là mô hình hành lang thử nghiệm, chưa phải sơ đồ kiến trúc chính thức.";
  const closeBtn=document.createElement("button");
  closeBtn.type="button";closeBtn.className="gn2-hall-close";
  closeBtn.setAttribute("aria-label","Quay lại phòng hiện tại");
  closeBtn.textContent="✕ Quay lại";
  head.append(heading,help,closeBtn);
  const scene=document.createElement("div");
  scene.className="gn2-hall-scene";
  scene.setAttribute("aria-label","Bảy lối vào trong hành lang chung");
  const backdrop=document.createElement("div");
  backdrop.className="gn2-hall-scenery";
  backdrop.setAttribute("aria-hidden","true");
  backdrop.innerHTML='<div class="gn2-hall-window">☀️ 🌸</div><div class="gn2-hall-rug"></div><div class="gn2-hall-floor-lights">✨ ✨ ✨</div>';
  scene.appendChild(backdrop);
  const avatar=document.createElement("span");
  avatar.className="gn2-hall-avatar";
  avatar.setAttribute("aria-hidden","true");
  avatar.textContent="🧸";
  const doors=[];
  let travel=null,source=null,sequence=0;
  const isReduced=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stopJourney=()=>{
    sequence++;
    if(travel){travel.cancel();travel=null;}
    for(const b of doors)b.disabled=false;
    avatar.style.left="50%";avatar.style.top="93%";
    avatar.classList.remove("is-travelling");
  };
  for(const entry of V2_DOORS){
    const button=document.createElement("button");
    button.type="button";button.className="gn2-hall-door";
    button.dataset.gn2Destination=entry.id;
    button.setAttribute("aria-label","Vào "+entry.label);
    button.style.left=entry.x+"%";
    button.style.top=entry.y+"%";
    const icon=document.createElement("span");
    icon.className="gn2-hall-door-emoji";icon.setAttribute("aria-hidden","true");
    icon.textContent=entry.emoji;
    const tag=document.createElement("span");
    tag.className="gn2-hall-door-name";tag.textContent=entry.label;
    button.append(icon,tag);
    button.addEventListener("click",async()=>{
      if(!dialog.open||travel||button.disabled||!source)return;
      const route=hallRoute(source,entry.id);
      if(!route)return;
      const ticket=++sequence;
      doors.forEach(b=>b.disabled=true);
      button.classList.add("gn2-hall-door-selected");
      avatar.classList.add("is-travelling");
      const frames=route.map((pt,i)=>({
        left:pt[0]+"%",top:pt[1]+"%",offset:i/(route.length-1)
      }));
      const anim=avatar.animate(frames,{
        duration:isReduced()?1:800,
        easing:"ease-in-out",fill:"forwards"
      });
      travel=anim;
      try{await anim.finished;}catch{return;}
      if(ticket!==sequence||!dialog.open||source===null)return;
      travel=null;
      stopJourney();
      dialog.close();
      onSelect(entry.id);
    });
    doors.push(button);
    scene.append(button);
  }
  scene.append(avatar);
  const foot=document.createElement("footer");
  foot.className="gn2-hall-foot";
  foot.textContent="Di chuyển tại đây chỉ hiển thị trên điện thoại này · Không gửi vị trí lên mạng";
  shell.append(head,scene,foot);dialog.append(shell);
  const cancel=()=>{stopJourney();source=null;};
  dialog.addEventListener("cancel",cancel);
  dialog.addEventListener("close",cancel);
  closeBtn.addEventListener("click",()=>{cancel();if(dialog.open)dialog.close();});
  document.body.appendChild(dialog);
  return {
    open(room){
      if(!V2_DOORS.some(d=>d.id===room))return false;
      stopJourney();source=room;
      doors.forEach(b=>b.classList.toggle("gn2-hall-current",b.dataset.gn2Destination===room));
      if(!dialog.open)dialog.showModal();
      closeBtn.focus();
      return true;
    },
    close(){cancel();if(dialog.open)dialog.close();},
    get isOpen(){return dialog.open;}
  };
}
