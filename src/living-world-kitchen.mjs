/* Góc Nhỏ V2 · interactive stove and dinner table, same-room flow.
 * Preview-only: pass-and-play, ZERO Firebase writes and no persistence.
 */
import {INGREDIENTS,DISHES,roundPlan,newKitchenSession,kitchenAction,totalScore} from "./living-world-kitchen-engine.mjs";

if(new URLSearchParams(location.search).get("world2")==="1" && window.__GN_WORLD_V2__) {
  const ingredientById=new Map(INGREDIENTS.map(x=>[x.id,x]));
  const dishById=new Map(DISHES.map(x=>[x.id,x]));
  const heatNames=["","Lửa liu riu","Lửa vừa","Lửa lớn"];
  let game=null,lastMessage="",focusBefore=null;
  const dialog=document.createElement("dialog");
  dialog.id="gn2-kitchen";
  dialog.className="gn2-dialog gn2-kitchen-dialog";
  dialog.setAttribute("aria-label","Bếp hỗn loạn của hai đứa");
  const header=document.createElement("div");header.className="gn2-dialog-header";
  const heading=document.createElement("strong");heading.className="gn2-dialog-title";heading.textContent="🍳 Bếp hỗn loạn";
  const close=document.createElement("button");close.type="button";close.className="gn2-close";close.textContent="✕ Đóng";
  close.addEventListener("click",()=>dialog.close());
  header.append(heading,close);
  const body=document.createElement("div");body.className="gn2-dialog-content gn2-kitchen-content";
  dialog.append(header,body);document.body.appendChild(dialog);
  dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});
  dialog.addEventListener("close",()=>{if(focusBefore?.isConnected)focusBefore.focus();});
  const node=(tag,cls,text)=>{
    const x=document.createElement(tag);if(cls)x.className=cls;
    if(text!==undefined)x.textContent=String(text);return x;
  };
  const button=(label,fn,kind="gn2-secondary")=>{
    const b=node("button",kind,label);b.type="button";b.addEventListener("click",fn);return b;
  };
  const info=text=>body.append(node("p","gn2-muted",text));
  const title=text=>body.append(node("h3","gn2-mini-head",text));
  function stage() {
    const round=game?.round||0;
    return "Vòng "+(round+1)+"/2 · "+(round===0?"A dẫn — B nấu":"B dẫn — A nấu");
  }
  function resetBody(){
    body.replaceChildren();
    body.append(node("p","gn2-status","Chơi chuyền máy · chỉ lưu trong bộ nhớ phiên thử, không gửi lên Firebase"));
  }
  function makeStove(icon,subtext,hot=false) {
    const stove=node("div","gn2-kitchen-stove"+(hot?" is-hot":""));
    stove.append(node("div","gn2-kitchen-pot",icon));
    stove.append(node("span","gn2-kitchen-steam","♨ ♨ ♨"));
    stove.append(node("div","gn2-kitchen-stove-sub",subtext));
    body.append(stove);
  }
  function start() {
    const random=globalThis.crypto?.getRandomValues?globalThis.crypto.getRandomValues(new Uint32Array(1))[0]:
      (Math.random()*4294967296)>>>0;
    game=newKitchenSession(random);lastMessage="";render();
  }
  function act(action,feedback) {
    const previous=game;
    game=kitchenAction(game,action);
    if(game!==previous){
      if(feedback)lastMessage=feedback;
      if(game.phase==="result")lastMessage=game.prepared.success?
        "Thơm quá! Một món ăn vừa ra lò ♡":"Ôi không, bếp bốc khói hình trái tim! Chơi tiếp vẫn vui mà.";
      render();syncPlate();
    }
  }
  function welcome(){
    title("Đây không còn là nút 'Bật bếp' nữa!");
    makeStove("🍲","Hai đứa cùng tạo món ăn bất ngờ");
    info("Một người giữ đơn hàng bí mật, người còn lại điều chỉnh lửa và thả nguyên liệu đúng thứ tự. Hai vòng đổi vai, có món mới và luật xáo trộn mỗi lần chơi.");
    body.append(button("▶ Bắt đầu 2 vòng nấu","", "gn2-primary"));
    const b=body.lastElementChild;b.addEventListener("click",start);
  }
  function briefing(){
    const plan=roundPlan(game.rounds[game.round]);const role=game.round===0?"A":"B";
    title("📜 Bí quyết của người "+role);
    info(stage()+" · Người "+role+" xem đơn hàng rồi hướng dẫn người kia bằng lời. Đừng để người nấu nhìn vào giấy nhé!");
    const recipe=node("section","gn2-kitchen-recipe");
    recipe.append(node("h4","",plan.dish.icon+" "+plan.dish.name));
    recipe.append(node("p","gn2-kitchen-modifier","🎲 "+plan.mode.name+" — "+plan.mode.help));
    const steps=node("ol","gn2-kitchen-recipe-steps");
    for(const s of plan.steps){
      const item=ingredientById.get(s.ingredient);
      const li=node("li","",item.icon+" "+item.name+" · "+heatNames[s.heat]);
      li.dataset.kitchenStep=s.ingredient;
      li.dataset.heat=String(s.heat);steps.append(li);
    }
    recipe.append(steps);body.append(recipe);
    body.append(button("🔒 Cất giấy — tới lượt người nấu",()=>act({type:"handoff"}),"gn2-primary"));
  }
  function cooking(){
    const r=game.rounds[game.round],plan=roundPlan(r);
    title("🧑‍🍳 Người nấu bắt đầu!");
    info(stage()+" · Nghe người dẫn đọc nguyên liệu và mức lửa. Giấy bí mật đã được cất.");
    makeStove("🍳","Đã bỏ "+game.progress+"/"+plan.steps.length+" nguyên liệu",true);
    const gauge=node("div","gn2-kitchen-heat");
    gauge.append(node("strong","","🔥 Chọn lửa:"));
    [1,2,3].forEach(n=>{
      const b=button(heatNames[n],()=>act({type:"heat",value:n}),"gn2-kitchen-heat-button");
      b.setAttribute("aria-pressed",String(game.heat===n));gauge.append(b);
    });
    body.append(gauge);
    body.append(node("strong","gn2-kitchen-label","Chọn nguyên liệu để thả vào chảo"));
    const ingredients=node("div","gn2-kitchen-ingredients");
    r.choices.forEach(id=>{
      const ingredient=ingredientById.get(id);
      if(!ingredient)return;
      const b=button(ingredient.icon+" "+ingredient.name,()=>{
        const step=plan.steps[game.progress];
        const ok=step && step.ingredient===id && step.heat===game.heat;
        act({type:"ingredient",value:id},ok?"Tuyệt! Đã thêm "+ingredient.name+" ♡":
          "Ối! Hỏi lại người dẫn công thức xem nguyên liệu hay lửa đã đúng chưa.");
      },"gn2-kitchen-ingredient");
      b.dataset.ingredient=id;ingredients.append(b);
    });
    body.append(ingredients);
    const errors=node("div","gn2-kitchen-chaos");
    errors.append(node("strong","","💭 Độ hỗn loạn: "+game.mistakes+"/3"));
    if(lastMessage)errors.append(node("span","",lastMessage));
    body.append(errors);
    info("Không có đồng hồ hay phạt khi rời app. Ba lần lệch công thức thì món ăn hóa thành một bất ngờ hài hước.");
  }
  function result() {
    const dish=dishById.get(game.prepared.dish);
    title(game.prepared.success?"✨ Món ăn ra lò!":"💨 Huyền thoại bếp khói hồng!");
    makeStove(game.prepared.success?dish.icon:"🍞",
      game.prepared.success?dish.name:"Một chiếc bánh than đáng yêu");
    body.append(node("p","gn2-kitchen-score","Điểm vòng này: "+game.prepared.score+"/100 · "+game.prepared.mistakes+" lần lộn xộn"));
    info("Món ăn xuất hiện ngay trên bàn trong Bếp, không chuyển sang tab khác. Đây vẫn là một thử nghiệm trên máy này.");
    if(game.round===0)body.append(button("⇄ Đổi vai — nấu món thứ hai",()=>{lastMessage="";act({type:"next"});},"gn2-primary"));
    else body.append(button("🎊 Xem kết quả hai vòng",()=>act({type:"finish"}),"gn2-primary"));
    body.append(button("👀 Nhìn món trên bàn",()=>dialog.close()));
  }
  function done(){
    title("🎉 Hai đầu bếp của Góc Nhỏ");
    const total=totalScore(game);
    makeStove("🍱","Tổng điểm "+total+"/200 · hai vòng đổi vai");
    const list=node("ul","gn2-kitchen-results");
    game.results.forEach((r,i)=>{
      const dish=dishById.get(r.dish);
      list.append(node("li","",(i+1)+". "+(r.success?dish.icon:"🍞")+" "+dish.name+" — "+r.score+" điểm"));
    });
    body.append(list);
    info("Không có hình phạt khó chịu: thắng thì có bữa ăn ngon, thua thì có một chuyện cười để kể.");
    body.append(button("↻ Bốc công thức mới và chơi lại",start,"gn2-primary"));
    body.append(button("🍽 Xem bàn ăn",()=>dialog.close()));
  }
  function render() {
    resetBody();
    if(!game){welcome();return;}
    if(game.phase==="brief")briefing();
    else if(game.phase==="cooking")cooking();
    else if(game.phase==="result")result();
    else done();
  }
  function open() {
    focusBefore=document.activeElement;
    const other=document.querySelector("dialog[open]");
    if(other && other!==dialog)other.close();
    render();
    if(!dialog.open)dialog.showModal();
  }
  function lookAtTable() {
    if(!game?.prepared){open();return;}
    focusBefore=document.activeElement;
    const other=document.querySelector("dialog[open]");
    if(other && other!==dialog)other.close();
    resetBody();
    const dish=dishById.get(game.prepared.dish);
    title("🍽 Bàn ăn của hai đứa");
    makeStove(game.prepared.success?dish.icon:"🍞",
      game.prepared.success?dish.name:"Món than hồng siêu đáng yêu");
    info("Món này đang được bày trên bàn trong cùng căn bếp. Chơi lại sẽ tạo một bữa ăn khác.");
    body.append(button("Tiếp tục nấu",()=>render(),"gn2-primary"));
    if(!dialog.open)dialog.showModal();
  }
  function syncPlate() {
    const root=document.getElementById("v-bep");
    const canvas=root&&!root.hidden?root.querySelector(".room3d .wcanvas"):null;
    if(!canvas)return;
    const old=canvas.querySelector(".gn2-kitchen-plate");
    if(old)old.remove();
    if(!game?.prepared)return;
    const dish=dishById.get(game.prepared.dish);
    const plate=button((game.prepared.success?dish.icon:"🍞"),lookAtTable,"gn2-kitchen-plate");
    plate.title="Chạm món ăn vừa nấu: "+dish.name;
    plate.setAttribute("aria-label","Xem món ăn vừa nấu trên bàn");
    plate.append(node("span","gn2-kitchen-plate-hearts","♥"));
    canvas.append(plate);
  }
  const previousRoomItem=roomItem;
  roomItem=function(room,key){
    if(room==="bep"&&key==="bepnau"){open();return;}
    if(room==="bep"&&key==="banan"){lookAtTable();return;}
    return previousRoomItem.apply(this,arguments);
  };
  const previousRenderRooms=renderRooms;
  renderRooms=function() {
    const result=previousRenderRooms.apply(this,arguments);
    syncPlate();
    return result;
  };
  window.addEventListener("hashchange",()=>requestAnimationFrame(syncPlate));
  window.__GN_KITCHEN_V2__={mode:"local-pass-and-play",networkWrites:false,recipes:DISHES.length,roundsPerSession:2};
}
