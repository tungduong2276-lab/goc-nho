// Đời sống chung: lõi thuần cho trồng trọt -> kho -> bếp -> thú nuôi.
// Không sửa schema/dữ liệu của các tab cũ. Mọi thay đổi hợp lệ đi qua transaction khi online.
export const FOOD = Object.freeze({
  xalach:{name:"Xà lách",emoji:"🥬"},dau:{name:"Dâu tây",emoji:"🍓"},
  cachua:{name:"Cà chua",emoji:"🍅"},carot:{name:"Cà rốt",emoji:"🥕"},
  khoai:{name:"Khoai tây",emoji:"🥔"},bingo:{name:"Bí ngô",emoji:"🎃"},
  trung:{name:"Trứng gà",emoji:"🥚"},trungvit:{name:"Trứng vịt",emoji:"🥚"},
  ca:{name:"Cá",emoji:"🐟"}
});
export const RECIPES=Object.freeze({
  salad:{name:"Salad vườn nhà",emoji:"🥗",need:{xalach:2,cachua:1}},
  sup:{name:"Súp rau củ",emoji:"🥣",need:{carot:1,khoai:1,cachua:1}},
  trung:{name:"Trứng cuộn",emoji:"🍳",need:{trung:2,cachua:1}},
  sinhto:{name:"Sinh tố dâu",emoji:"🥤",need:{dau:3}},
  canhca:{name:"Canh cá ngọt",emoji:"🍲",need:{ca:1,cachua:2}},
  banhbi:{name:"Bánh bí ngô",emoji:"🥧",need:{bingo:1,trung:1}},
  trungvit:{name:"Trứng vịt kho",emoji:"🍛",need:{trungvit:2,khoai:1}}
});
const WHO=new Set(["anh","em"]),MAX_STOCK=999,MAX_MEALS=24;
const number=(n,upper=MAX_STOCK)=>Number.isInteger(n)&&n>=0?Math.min(n,upper):0;
export const INITIAL_LIFE=Object.freeze({v:1,stock:{},hens:{ga:0,vit:0},fish:{count:2,fedAt:0,caughtAt:0},pet:{kind:"meo",name:"Miu",fedAt:0,playedAt:0},pending:null,meals:[]});
export function sanitizeLife(raw){
  const d=raw&&raw.v===1?raw:INITIAL_LIFE,stock={};
  for(const k of Object.keys(FOOD))stock[k]=number(d.stock?.[k]);
  const hens={ga:number(d.hens?.ga,1e15),vit:number(d.hens?.vit,1e15)};
  const fish={count:number(d.fish?.count,8),fedAt:number(d.fish?.fedAt,1e15),caughtAt:number(d.fish?.caughtAt,1e15)};
  const pet={kind:["meo","cho","tho"].includes(d.pet?.kind)?d.pet.kind:"meo",
    name:typeof d.pet?.name==="string"?d.pet.name.slice(0,24):"Miu",
    fedAt:number(d.pet?.fedAt,1e15),playedAt:number(d.pet?.playedAt,1e15)};
  const p=d.pending;
  const pending=p&&RECIPES[p.recipe]&&WHO.has(p.by)&&Number.isFinite(p.at)
    ? {recipe:p.recipe,by:p.by,at:p.at}:null;
  const meals=Array.isArray(d.meals)?d.meals.filter(x=>x&&RECIPES[x.recipe]&&Number.isFinite(x.at)&&WHO.has(x.by))
    .slice(-MAX_MEALS).map(x=>({recipe:x.recipe,at:x.at,by:x.by,with:WHO.has(x.with)?x.with:null})): [];
  return {v:1,stock,hens,fish,pet,pending,meals};
}
export function sufficient(stock,need){return Object.entries(need).every(([k,n])=>(stock[k]||0)>=n);}
export function isEdible(sp){return sp in FOOD && !["trung","trungvit","ca"].includes(sp);}
const COOL={ga:6*3600e3,vit:8*3600e3,ca:30*60e3,play:5*60e3};
const fail=(state,message)=>({ok:false,next:state,message});
export function applyLife(raw,op,who,at=Date.now()){
  const s=sanitizeLife(raw);
  if(!WHO.has(who)||!Number.isFinite(at)||!op||typeof op!=="object")return fail(s,"Hành động không hợp lệ");
  const kind=op.type;
  const add=(key,n)=>{s.stock[key]=Math.min(MAX_STOCK,s.stock[key]+n);};
  const use=(need)=>{if(!sufficient(s.stock,need))return false;for(const [k,n]of Object.entries(need))s.stock[k]-=n;return true;};
  const ok=message=>({ok:true,next:s,message});
  if(kind==="harvest"){
    if(!isEdible(op.sp)||!Number.isInteger(op.amount)||op.amount<1||op.amount>3)return fail(s,"Giỏ không nhận loại cây này");
    add(op.sp,op.amount);return ok("Đã cất "+op.amount+" "+FOOD[op.sp].emoji+" vào kho chung");
  }
  if(kind==="feedHen"||kind==="feedDuck"){
    const ga=kind==="feedHen",k=ga?"ga":"vit",egg=ga?"trung":"trungvit";
    if(at-s.hens[k]<COOL[k]&&s.hens[k]>0)return fail(s,"Bé vừa được ăn, quay lại sau nhé");
    if(!use({xalach:1}))return fail(s,"Cần một cây xà lách từ vườn 🥬");
    s.hens[k]=at;add(egg,ga?2:1);
    return ok((ga?"Gà":"Vịt")+" được cho ăn, nhặt được "+(ga?2:1)+" quả trứng 🥚");
  }
  if(kind==="catchFish"){
    if(s.fish.caughtAt&&at-s.fish.caughtAt<COOL.ca)return fail(s,"Hồ đang yên, chờ cá quay lại nhé");
    s.fish.caughtAt=at;add("ca",1);return ok("Câu được một bé cá 🐟, đã cho vào kho");
  }
  if(kind==="stockFish"){
    if(s.fish.count>=8)return fail(s,"Bể cá đã đủ 8 bé");
    if(!use({ca:1}))return fail(s,"Câu cá trước rồi thả nuôi nhé");
    s.fish.count++;return ok("Thả thêm một bé cá vào hồ 🐠");
  }
  if(kind==="feedFish"){
    if(!s.fish.count)return fail(s,"Hồ chưa có cá");
    if(s.fish.fedAt&&at-s.fish.fedAt<COOL.ga)return fail(s,"Cá vừa ăn rồi");
    if(!use({xalach:1}))return fail(s,"Cần rau từ vườn để chăm hồ cá");
    s.fish.fedAt=at;return ok(s.fish.count+" bé cá đang ăn 🫧");
  }
  if(kind==="adoptPet"){
    if(!["meo","cho","tho"].includes(op.pet))return fail(s,"Chưa có loài thú này");
    s.pet={kind:op.pet,name:op.pet==="meo"?"Miu":op.pet==="cho"?"Bông":"Bé Bông",fedAt:0,playedAt:0};
    return ok("Đã đón thú cưng mới về nhà 💗");
  }
  if(kind==="feedPet"){
    const food=s.pet.kind==="meo"?"ca":s.pet.kind==="tho"?"carot":"trung";
    if(!use({[food]:1}))return fail(s,"Bé cần "+FOOD[food].name.toLowerCase()+" từ kho");
    s.pet.fedAt=at;return ok(s.pet.name+" đã ăn no và rất vui 💗");
  }
  if(kind==="playPet"){
    if(s.pet.playedAt&&at-s.pet.playedAt<COOL.play)return fail(s,"Bé đang nghỉ một chút");
    s.pet.playedAt=at;return ok(s.pet.name+" thích chơi cùng bạn lắm 🐾");
  }
  if(kind==="prepareCook"){
    const recipe=RECIPES[op.recipe];if(!recipe)return fail(s,"Chưa có món này");
    if(s.pending&&at-s.pending.at<10*60e3)return fail(s,"Đang có một món chờ người kia cùng nấu");
    if(!sufficient(s.stock,recipe.need))return fail(s,"Thiếu nguyên liệu, ra vườn hoặc chuồng nhé");
    s.pending={recipe:op.recipe,by:who,at};return ok("Đã sơ chế "+recipe.name+". Rủ người kia đến bếp!");
  }
  if(kind==="finishCook"||kind==="cookSolo"){
    const p=s.pending;
    if(!p||at-p.at>10*60e3)return fail(s,"Món đang chuẩn bị đã hết lượt, chọn lại nhé");
    if(kind==="finishCook"&&p.by===who)return fail(s,"Để người kia hoàn thành bước nấu nhé");
    const recipe=RECIPES[p.recipe];
    if(!use(recipe.need)){s.pending=null;return fail(s,"Kho không còn đủ nguyên liệu, thử lại nhé");}
    s.meals.push({recipe:p.recipe,by:p.by,with:kind==="finishCook"?who:null,at});
    s.meals=s.meals.slice(-MAX_MEALS);s.pending=null;
    return ok("Xong "+recipe.name+"! "+(kind==="finishCook"?"Hai đứa cùng nấu ngon hơn 💞":"Đã nấu xong 🍽️"));
  }
  if(kind==="eat"){
    const idx=number(op.index,MAX_MEALS-1);
    if(idx>=s.meals.length)return fail(s,"Chưa có món này trong bàn ăn");
    const m=s.meals.splice(idx,1)[0];return ok("Mời bạn thưởng thức "+RECIPES[m.recipe].name+" 🍽️");
  }
  return fail(s,"Hành động chưa hỗ trợ");
}
