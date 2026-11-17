import { FOOD, RECIPES, sufficient, sanitizeLife } from "./life.mjs";

// Phiếu thao tác nổi ngay trên đảo 3D; toàn bộ dữ liệu từ Firebase chỉ dùng qua textContent.
export function createLifeUI({ getState, act, who, online, connected = online }) {
  const el=document.createElement("section");el.id="life-sheet";el.className="sheet life-sheet";el.hidden=true;
  el.setAttribute("aria-label","Nhịp sống của hai đứa");el.setAttribute("role","dialog");
  document.body.appendChild(el);
  let zone="kitchen",busy=false,note="";
  const zones={pantry:"🧺 Kho thức ăn",kitchen:"🍳 Bếp chung",coop:"🐔 Chăn nuôi",pond:"🐠 Hồ cá",pet:"🐾 Thú cưng"};
  function button(label,fn,disabled=false){
    const b=document.createElement("button");b.type="button";b.className="life-button";
    b.textContent=label;b.disabled=disabled||busy;
    b.addEventListener("click",async()=>{
      if(busy)return;
      busy=true;render();
      try { const result=await fn();note=result?.message||""; }
      catch(err){console.warn("Góc Nhỏ: thao tác đời sống không hoàn tất",err);note="Chưa lưu được. Kiểm tra kết nối và thử lại nhé.";}
      finally{busy=false;render();}
    });
    return b;
  }
  const text=(tag,value,klass="")=>{const n=document.createElement(tag);n.textContent=value;if(klass)n.className=klass;return n;};
  const line=(root,value)=>root.appendChild(text("p",value,"life-hint"));
  function render(){
    if(el.hidden)return;
    el.replaceChildren();
    const s=sanitizeLife(getState());
    const header=document.createElement("div");header.className="life-header";
    header.append(text("h2",zones[zone]));
    const close=button("✕",async()=>{el.hidden=true;return {message:""};});close.className="life-close";close.setAttribute("aria-label","Đóng");header.append(close);el.append(header);
    const tabs=document.createElement("div");tabs.className="life-tabs";
    for(const [id,label]of Object.entries(zones)){
      const b=document.createElement("button");b.type="button";b.textContent=label;b.className=id===zone?"life-selected":"";
      b.setAttribute("aria-pressed",String(id===zone));b.addEventListener("click",()=>{zone=id;note="";render();});tabs.append(b);
    }
    el.append(tabs);
    const sync=connected()?(online()?"💞 Kho của hai người · tự đồng bộ":"⚠️ Mất mạng · kho chung chưa thể ghi tiếp"):"📱 Chế độ trên máy · chưa đồng bộ với người kia";
    const status=text("p",sync,"life-sync");el.append(status);
    if(note)el.append(text("p",note,"life-note"));
    const panel=document.createElement("div");panel.className="life-panel";el.append(panel);
    const action=(label,op,disabled)=>panel.append(button(label,()=>act(op),disabled));
    const inventory=()=>{
      const box=document.createElement("div");box.className="life-stock";
      for(const [k,d]of Object.entries(FOOD)){
        const amount=s.stock[k]||0;if(!amount)continue;
        const chip=text("span",d.emoji+" "+d.name+" ×"+amount);box.append(chip);
      }
      panel.append(box);
      if(!box.childElementCount)line(panel,"Kho đang trống. Ra vườn, chuồng hoặc hồ cá để kiếm nguyên liệu nhé!");
    };
    if(zone==="pantry"){
      line(panel,"Rau củ thu hoạch ở luống, trứng từ chuồng và cá câu được đều vào đây. Bếp dùng chung kho này.");
      inventory();
      panel.append(text("h3","🍽️ Món đã nấu"));
      if(!s.meals.length)line(panel,"Chưa có món nào. Hai đứa cùng nấu nhé!");
      s.meals.forEach((m,i)=>action(RECIPES[m.recipe].emoji+" "+RECIPES[m.recipe].name+(m.with?" 💞":"")+" · Ăn", {type:"eat",index:i}));
    } else if(zone==="kitchen"){
      line(panel,"Một người sơ chế, người kia đến bếp hoàn thành. Nếu đang chơi trên một máy, vẫn có thể nấu một mình.");
      inventory();
      if(s.pending){
        const recipe=RECIPES[s.pending.recipe];
        panel.append(text("h3",recipe.emoji+" Đang sơ chế: "+recipe.name));
        line(panel,"Người bắt đầu: "+(s.pending.by==="anh"?"Anh":"Em"));
        if(s.pending.by!==who())action("💞 Cùng hoàn thành món", {type:"finishCook"});
        else{line(panel,"Đang chờ người kia giúp bước cuối 💗");action("🍳 Tự hoàn thành", {type:"cookSolo"});}
      }else{
        panel.append(text("h3","Chọn món để sơ chế"));
        for(const [key,r]of Object.entries(RECIPES)){
          const ingredients=Object.entries(r.need).map(([k,n])=>FOOD[k].emoji+"×"+n).join(" ");
          action(r.emoji+" "+r.name+" · "+ingredients,{type:"prepareCook",recipe:key},!sufficient(s.stock,r.need));
        }
      }
    } else if(zone==="coop"){
      line(panel,"Cho hai bé ăn rau từ vườn, cùng nhặt trứng về bếp. Mỗi bé có giờ ăn riêng.");
      inventory();
      action("🐔 Cho gà ăn → nhận 2 trứng",{type:"feedHen"},!s.stock.xalach);
      action("🦆 Cho vịt ăn → nhận 1 trứng",{type:"feedDuck"},!s.stock.xalach);
    } else if(zone==="pond"){
      line(panel,"Câu cá đem nấu hoặc thả thêm vào hồ. Cho cá ăn rau và chăm hồ cùng nhau.");
      panel.append(text("h3","🐠 "+s.fish.count+" bé cá đang sống trong hồ"));
      inventory();
      action("🎣 Câu cá đem về kho",{type:"catchFish"});
      action("🐠 Thả một bé cá từ kho vào hồ",{type:"stockFish"},!s.stock.ca||s.fish.count>=8);
      action("🥬 Cho đàn cá ăn",{type:"feedFish"},!s.stock.xalach);
    } else if(zone==="pet"){
      const emoji={meo:"🐈",cho:"🐕",tho:"🐇"}[s.pet.kind];
      panel.append(text("h3",emoji+" "+s.pet.name+" · thú cưng chung"));
      line(panel,"Chơi cùng bé mỗi ngày, dùng thức ăn thật trong kho. Đổi loài sẽ đón một bé mới về nhà.");
      inventory();
      action("💗 Cho bé ăn",{type:"feedPet"});
      action("🧶 Chơi với bé",{type:"playPet"});
      for(const [pet,label]of [["meo","🐈 Nhận mèo"],["cho","🐕 Nhận cún"],["tho","🐇 Nhận thỏ"]]){
        if(pet!==s.pet.kind)action(label,{type:"adoptPet",pet});
      }
    }
    if(busy)panel.append(text("small","Đang xác nhận vào kho chung…","life-saving"));
  }
  function open(next){
    if(!zones[next])return;
    document.querySelectorAll(".sheet:not(.mini)").forEach(s=>s.hidden=true);
    zone=next;note="";el.hidden=false;render();
    el.querySelector(".life-close")?.focus({preventScroll:true});
  }
  el.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();el.hidden=true;}});
  return {open,refresh:render,close:()=>{el.hidden=true;},active:()=>!el.hidden,element:el};
}
