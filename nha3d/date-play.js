import * as A from "./date-activities.mjs";
export function createDatePlay(o){
 const root=document.querySelector("#dateplay"),title=root.querySelector("h2"),body=root.querySelector(".dateplay-body"),remote=new Map(),local=new Map();
 let tab=null,busy=false,key="",lastDone="",time=0,display=null,displayKey="",jump=null;
 const props=new Map();
 try{for(const [id,d] of JSON.parse(o.store.get("gocnho.date.activities.v1")||"[]"))if(A.readActivity(d))local.set(id,d);}catch{}
 const live=()=>o.cloud().on,uid=()=>live()?o.cloud().api.uid:"practice-"+o.who(),map=()=>live()?remote:local;
 const state=kind=>map().get(A.dateDocId(kind,uid()))||null;
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const text=(s,cls)=>body.appendChild(el("p",s,cls));
 const button=(s,fn,disabled=false)=>{const b=el("button",s,"date-action");b.disabled=disabled||busy;b.onclick=fn;body.append(b);return b;};
 function receive(id,data){if(!id.startsWith("a_date_"))return;if(!data)remote.delete(id);else{const d=A.readActivity(data);if(d)remote.set(id,d);}render();}
 async function act(kind,action,value,asPartner=false){
  if(busy)return;busy=true;key="";render();
  const actor=asPartner?(o.who()==="anh"?"em":"anh"):o.who();
  const command={action,who:actor,nonce:crypto.randomUUID(),expectedRev:state(kind)?.rev||0};
  if(action==="start")command.recipe=value;else if(value!==undefined)command.value=value;
  try{
   if(o.scene()!=="hen"||!o.near(kind))throw Error("Đi lại gần quầy hoặc bến câu để chơi nhé");
   if(live()){
    if(asPartner)throw Error("Lượt này cần người kia thao tác trên máy của họ");
    if(!navigator.onLine)throw Error("Mất mạng rồi; kết nối lại để gửi lượt chơi");
    if(!o.cloud().api.actDate)throw Error("Chưa có kết nối hoạt động chung");
    const r=await o.cloud().api.actDate(kind,command);receive(r.id,r.data);if(kind==="cook")o.invite?.();
   }else{
    if(asPartner)o.practiceMove?.();
    const actorUid=asPartner?"practice-"+actor:uid(),id=A.dateDocId(kind,actorUid);
    const next=A.advanceActivity(local.get(id)||null,{...command,kind,uid:actorUid,now:o.now()});
    local.set(id,next);o.store.set("gocnho.date.activities.v1",JSON.stringify([...local]));
   }
  }catch(e){o.toast(e.message||"Chưa gửi được lượt chơi");}
  finally{busy=false;key="";render();}
 }
 function open(kind="guide"){tab=kind;root.hidden=false;key="";render();root.querySelector("[data-date-close]").focus({preventScroll:true});}
 function close(){tab=null;root.hidden=true;key="";}
 root.querySelector("[data-date-close]").onclick=close;document.querySelector("#btn-date").onclick=()=>open("guide");
 function render(){
  if(!tab)return;
  const cook=state("cook"),fish=state("fish"),phase=A.fishPhase(fish,o.now());
  const k=JSON.stringify([tab,busy,live(),uid(),cook,fish,phase]);if(key===k)return;key=k;body.replaceChildren();
  title.textContent=tab==="cook"?"Quầy của hai đứa":tab==="fish"?"Một buổi câu cá":"Hẹn hò trên đảo";
  text(live()?"Đang chơi cùng tài khoản của hai đứa":"Tập chơi · bạn mô phỏng, chỉ lưu trên máy","date-mode");
  if(tab==="guide"){
   text("Một buổi hẹn nhỏ: pha hai ly nước, câu vài chú cá rồi ngồi bên lửa. Không cần vội.");
   if(o.scene()!=="hen")button("⛵ Đi bộ ra bến, sang đảo hẹn hò",()=>{close();o.travel();});
   else{button("🧋 Đến quầy, cùng pha một món",()=>{close();o.route("h-cook","cook");});button("🎣 Ra bến câu cá",()=>{close();o.route("h-fish","fish");});button("🔥 Đến thảm, ngồi cạnh nhau",()=>{close();o.route("h-picnic","sit");});}
   text("Sổ hẹn: "+Object.keys(cook?.album||{}).length+"/"+A.RECIPES.length+" món đã cùng làm · "+(fish?.total||0)+" lần câu được cá","date-small");return;
  }
  if(o.scene()!=="hen"){text("Hoạt động nằm trên đảo hẹn hò.");button("Ra bến thuyền",()=>{close();o.travel();});return;}
  if(tab==="cook"){
   if(!cook||cook.phase==="done"||o.now()-cook.updatedAt>=600000){
    if(cook?.phase==="done")text(A.recipeOf(cook.recipe).icon+" "+A.recipeOf(cook.recipe).name+" · "+"★".repeat(cook.stars)+"☆".repeat(3-cook.stars)+" — hai ly đã đặt trên quầy!","date-result");
    text("Chọn một món. Mỗi người thêm một nguyên liệu, rồi thay phiên canh nhịp lắc.");
    const choices=el("div",undefined,"date-recipes");body.append(choices);
    for(const r of A.RECIPES){const b=el("button",r.icon+" "+r.name+(cook?.album?.[r.id]?" ★"+cook.album[r.id]:""));b.disabled=busy;b.onclick=()=>act("cook","start",r.id);choices.append(b);}return;
   }
   const r=A.recipeOf(cook.recipe),n=cook.steps.length,mine=cook.steps.at(-1)?.uid!==uid();
   text(r.icon+" "+r.name+" · bước "+(n+1)+"/4","date-result");text(n<2?"Thêm "+r.labels[n]+" vào bình":"Canh kim tới vùng hồng rồi chạm để lắc");
   if(!mine){text(live()?"Đến lượt bạn ấy. Bạn vẫn có thể nhìn bình pha thay đổi trong cảnh.":"Đến lượt bạn mô phỏng.","date-small");if(!live())button("Cho bạn mô phỏng thực hiện lượt",()=>act("cook",n<2?"ingredient":"mix",n<2?r.ingredients[n]:A.beatPosition(time),true));}
   else if(n<2){for(const [id,label]of[[r.ingredients[n],r.labels[n]],["da","Đá viên"],["muoi","Muối"]])button(label,()=>act("cook","ingredient",id));}
   else{const meter=el("div",undefined,"date-meter");meter.setAttribute("aria-label","Canh kim vào vùng hồng");const target=el("span",undefined,"date-target");target.style.left=(A.beatTarget(cook.recipe,n)*100-14)+"%";meter.append(target);const needle=el("i");needle.id="date-needle";meter.append(needle);body.append(meter);button("Lắc ngay!",()=>act("cook","mix",A.beatPosition(time)));}
   text((cook.steps.map(s=>s.who==="anh"?"Anh":"Em").join(" → ")||"Bình còn trống")+" · "+cook.steps.length+"/4 lượt","date-small");
  }else{
   text("Cá cắn phao sau một lúc. Chạm Giật cần lúc phao rung; chậm hay sớm quá là cá trốn.");
   if(phase==="waiting"){text("Phao đang trôi… nhìn mặt nước nhé","date-result");button("Giật cần sớm",()=>act("fish","reel"));}
   else if(phase==="bite"){text("Phao rung! Cá cắn rồi!","date-result");button("Giật cần!",()=>act("fish","reel"));}
   else{if(phase==="caught"){const f=A.FISH.find(x=>x.id===fish.catch.id);text(f.icon+" "+f.name+" · "+fish.catch.size+" cm"+(fish.catch.precise?" · nhịp thật đẹp!":""),"date-result");}if(phase==="escaped")text("Chú cá trốn mất rồi. Thả lại nhé, không mất gì đâu.");button("🎣 Thả câu",()=>act("fish","cast"));}
   const collection=fish?.collection||{};text("Giỏ của bạn: "+(fish?.total||0)+" chú · "+Object.keys(collection).length+"/"+A.FISH.length+" loài","date-small");
   text(A.FISH.map(f=>collection[f.id]?f.icon+" "+f.name+" ×"+collection[f.id]:"○ Chưa gặp").join(" · "),"date-collection");
   const other=[...map().values()].find(d=>d.kind==="fish"&&d.owner!==uid()&&d.total);if(other)text("Bạn ấy đã câu được "+other.total+" chú. Rủ nhau so giỏ nhé!","date-small");
  }
 }
 function step(dt,t){
  time=t*1000;render();const needle=document.querySelector("#date-needle");if(needle)needle.style.left=(A.beatPosition(time)*100)+"%";
  const cook=state("cook"),fish=state("fish"),on=o.scene()==="hen",done=cook?.phase==="done"?cook.rev:0;
  document.querySelector("#btn-date").textContent=live()&&cook?.phase==="making"&&cook.steps.at(-1)?.uid!==uid()?"💌 Đến lượt bạn":"⛵ Hẹn hò";
  if(on&&done&&lastDone!==String(done)+(live()?"live":"local")){lastDone=String(done)+(live()?"live":"local");o.celebrate("🧋 Hai ly cho hai đứa!",1);}
  for(const [who,actor]of Object.entries(o.actors)){
   const f=who===o.who()?fish:[...map().values()].find(d=>d.kind==="fish"&&d.who===who&&d.owner!==uid());
   const kind=on&&f&&["waiting","bite"].includes(A.fishPhase(f,o.now()))?"fish":on&&cook?.phase==="making"&&cook.steps.at(-1)?.who===who?"mix":null,prev=props.get(who);
   if(prev&&(prev.kind!==kind||prev.parent!==actor.R.root)){prev.model.removeFromParent();props.delete(who);}
   if(kind&&!props.has(who)){const model=o.models.tool(kind);actor.R.root.add(model);props.set(who,{kind,model,parent:actor.R.root});}
   const p=props.get(who);if(p)p.model.rotation.z=o.reduced()?0:Math.sin(t*(kind==="fish"?1.4:7))*.07;
  }
  const dk=on&&cook?.phase==="done"?cook.recipe+done:"";
  if(dk!==displayKey){display?.removeFromParent();display=null;displayKey=dk;if(dk){display=o.models.drinks();const p=o.position("h-cook");display.position.set(p.x,1.12,p.z+.15);o.sceneRoot.add(display);}}
  if(on&&fish?.phase==="caught"&&jump?.rev!==fish.rev){jump?.model?.removeFromParent();const f=A.FISH.find(f=>f.id===fish.catch.id),model=o.models.caughtFish(f.color),p=o.position("h-fish");model.position.set(p.x,1.1,p.z);o.sceneRoot.add(model);jump={model,rev:fish.rev,at:t,p};o.celebrate(f.icon+" "+f.name,0);}
  if(jump?.model){const elapsed=t-jump.at;if(!on||elapsed>2){jump.model.removeFromParent();jump.model=null;}else{jump.model.position.y=1.1+Math.sin(elapsed*Math.PI/2)*.9;jump.model.rotation.z=elapsed*2;}}
 }
 return {open,close,receive,step,state,act,snapshot:()=>({cook:state("cook"),fish:state("fish"),live:live()}),sceneChanged(){close();display?.removeFromParent();display=null;displayKey="";}};
}
