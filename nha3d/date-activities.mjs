// Bounded deterministic game state; writes only new world/a_date_* activity documents.
export const RECIPES=[
{id:"dau",name:"Sinh tố dâu đôi",icon:"🍓",ingredients:["dau","sua"],labels:["Dâu","Sữa"]},
{id:"dao",name:"Trà đào hoàng hôn",icon:"🍑",ingredients:["dao","tra"],labels:["Đào","Trà"]},
{id:"cam",name:"Cam mật ong",icon:"🍊",ingredients:["cam","mat"],labels:["Cam","Mật ong"]},
{id:"matcha",name:"Matcha mây nhỏ",icon:"🍵",ingredients:["matcha","sua"],labels:["Matcha","Sữa"]},
{id:"cacao",name:"Ca cao ấm áp",icon:"☕",ingredients:["cacao","sua"],labels:["Ca cao","Sữa"]},
{id:"chanh",name:"Chanh bạc hà",icon:"🍋",ingredients:["chanh","bac-ha"],labels:["Chanh","Bạc hà"]}];
export const FISH=[
{id:"bong",name:"Cá bống tinh nghịch",icon:"🐟",color:0x8ECDEB},
{id:"he",name:"Cá hề má hồng",icon:"🐠",color:0xFFAD73},
{id:"ngu",name:"Cá ngừ tí hon",icon:"🐟",color:0x89A8DA},
{id:"sao",name:"Sao biển lười",icon:"⭐",color:0xFFD876},
{id:"muc",name:"Mực đội mũ",icon:"🦑",color:0xEDADC9},
{id:"ngoc",name:"Cá ngọc ánh trăng",icon:"✨",color:0xCBB5EC}];
export const recipeOf=id=>RECIPES.find(r=>r.id===id)||RECIPES[0];
export function hash(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
const clone=x=>JSON.parse(JSON.stringify(x)),fail=s=>{throw new Error(s);};
export const dateDocId=(kind,uid)=>kind==="cook"?"a_date_cook":"a_date_fish_"+encodeURIComponent(uid);
export function readActivity(d){
 if(!d||d.k!=="activity"||d.v!==1||!["cook","fish"].includes(d.kind)||!Number.isInteger(d.rev)||d.rev<1)return null;
 if(d.kind==="cook"&&(!Array.isArray(d.steps)||d.steps.length>4||!RECIPES.some(r=>r.id===d.recipe)||!["making","done"].includes(d.phase)))return null;
 if(d.kind==="fish"&&(!Number.isFinite(d.biteAt)||!Number.isFinite(d.until)||typeof d.owner!=="string"||!["waiting","escaped","caught"].includes(d.phase)))return null;
 return clone(d);
}
export const beatPosition=t=>(Math.sin(t/650*Math.PI*2)+1)/2;
export const beatTarget=(recipe,step)=>.25+(hash(recipe+step)%50)/100;
export function fishPhase(d,now){return !d?"ready":d.phase!=="waiting"?d.phase:now>d.until?"escaped":now>=d.biteAt?"bite":"waiting";}
export function advanceActivity(raw,cmd){
 const {kind,uid,who,nonce,now,expectedRev=0}=cmd;
 if(!["cook","fish"].includes(kind)||typeof uid!=="string"||!uid||!["anh","em"].includes(who)||typeof nonce!=="string"||!nonce||nonce.length>100||!Number.isFinite(now))fail("Lượt chơi không hợp lệ");
 const old=readActivity(raw);
 if(raw&&!old)fail("Bản hoạt động chưa tương thích; không ghi đè");
 if(old&&old.kind!==kind)fail("Sai loại hoạt động");
 if(old?.lastNonce===nonce&&old.lastUid===uid)return old;
 if((old?.rev||0)!==expectedRev)fail("Bạn ấy vừa thao tác; thử lại sau khi cập nhật");
 let next;
 if(kind==="cook"){
  if(cmd.action==="start"){
   if(old&&old.phase!=="done"&&now-old.updatedAt<600000)fail("Hai đứa đang làm một món; cùng hoàn thành nhé");
   if(!RECIPES.some(r=>r.id===cmd.recipe))fail("Món chưa có trong thực đơn");
   next={k:"activity",v:1,kind,phase:"making",recipe:cmd.recipe,steps:[],album:old?.album||{},startedAt:now};
  }else{
   if(!old||old.phase!=="making")fail("Chọn món trước nhé");
   if(now-old.updatedAt>=600000)fail("Buổi pha đã nghỉ quá lâu; chọn món mới nhé");
   if(old.steps.at(-1)?.uid===uid)fail("Đến lượt người kia rồi 💗");
   const recipe=recipeOf(old.recipe),i=old.steps.length;
   if(i<2&&(cmd.action!=="ingredient"||cmd.value!==recipe.ingredients[i]))fail("Thử chọn đúng nguyên liệu của món nhé");
   if(i>=2&&(cmd.action!=="mix"||!Number.isFinite(cmd.value)||cmd.value<0||cmd.value>1))fail("Chạm khi kim tới vùng hồng");
   next=clone(old);next.steps.push({uid,who,action:cmd.action,good:i<2||Math.abs(cmd.value-beatTarget(old.recipe,i))<=.14});
   if(next.steps.length===4){next.phase="done";next.doneAt=now;next.stars=1+next.steps.slice(2).filter(s=>s.good).length;next.album[old.recipe]=Math.max(next.album[old.recipe]||0,next.stars);}
  }
 }else{
  if(old&&old.owner!==uid)fail("Cần câu này của người kia");
  if(cmd.action==="cast"){
   if(old?.phase==="waiting"&&now<=old.until)fail("Phao còn ở dưới nước");
   const seed=hash(uid+nonce),delay=2200+seed%2600;
   next={k:"activity",v:1,kind,owner:uid,who,phase:"waiting",biteAt:now+delay,until:now+delay+1700,seed,collection:old?.collection||{},total:old?.total||0,startedAt:now};
  }else if(cmd.action==="reel"){
   if(!old||old.phase!=="waiting")fail("Thả câu trước nhé");
   next=clone(old);
   if(now<old.biteAt||now>old.until){next.phase="escaped";next.catch=null;}
   else{const precise=Math.abs(now-(old.biteAt+850))<330,fish=FISH[(old.seed+(precise?3:0))%FISH.length];next.phase="caught";next.catch={id:fish.id,size:10+old.seed%36,precise};next.total++;next.collection[fish.id]=(next.collection[fish.id]||0)+1;}
  }else fail("Thao tác chưa có");
 }
 return {...next,rev:(old?.rev||0)+1,updatedAt:now,lastNonce:nonce,lastUid:uid};
}
