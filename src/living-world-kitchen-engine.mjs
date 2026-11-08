/* Góc Nhỏ V2 — deterministic, local-only cooperative kitchen game engine.
 * No browser APIs, Firebase access, persistent writes, or personal data.
 */
export const INGREDIENTS = Object.freeze([
  {id:"trung",name:"Trứng",icon:"🥚"},
  {id:"sua",name:"Sữa",icon:"🥛"},
  {id:"bo",name:"Bơ",icon:"🧈"},
  {id:"nam",name:"Nấm",icon:"🍄"},
  {id:"carot",name:"Cà rốt",icon:"🥕"},
  {id:"phomai",name:"Phô mai",icon:"🧀"},
  {id:"dau",name:"Dâu tây",icon:"🍓"},
  {id:"matong",name:"Mật ong",icon:"🍯"},
  {id:"mi",name:"Mì",icon:"🍜"},
  {id:"ca",name:"Cá",icon:"🐟"},
  {id:"rongbien",name:"Rong biển",icon:"🍙"},
  {id:"banhmi",name:"Bánh mì",icon:"🍞"},
  {id:"khoai",name:"Khoai tây",icon:"🥔"},
  {id:"cachua",name:"Cà chua",icon:"🍅"},
  {id:"tao",name:"Táo",icon:"🍎"},
  {id:"socola",name:"Sô cô la",icon:"🍫"}
]);
export const DISHES = Object.freeze([
  {id:"may-hong",name:"Trứng mây hồng",icon:"🍳",ingredients:["trung","sua","bo"],heat:1},
  {id:"mi-nam",name:"Mì nấm lấp lánh",icon:"🍜",ingredients:["mi","nam","phomai"],heat:2},
  {id:"banh-dau",name:"Bánh dâu bí mật",icon:"🍰",ingredients:["banhmi","dau","matong"],heat:1},
  {id:"ca-vien",name:"Cá cuộn biển sao",icon:"🍣",ingredients:["ca","rongbien","cachua"],heat:2},
  {id:"khoai-robot",name:"Khoai tây phi hành gia",icon:"🍟",ingredients:["khoai","phomai","bo"],heat:3},
  {id:"banh-tao",name:"Bánh táo lộn xộn",icon:"🥧",ingredients:["tao","bo","matong"],heat:2},
  {id:"trung-xanh",name:"Trứng vườn cổ tích",icon:"🥗",ingredients:["trung","carot","nam"],heat:2},
  {id:"sua-socola",name:"Sữa sô cô la trên mây",icon:"🍫",ingredients:["sua","socola","matong"],heat:1},
  {id:"mi-phi-thuyen",name:"Mì phi thuyền",icon:"🍝",ingredients:["mi","cachua","bo"],heat:3},
  {id:"banh-rong",name:"Bánh biển nhỏ",icon:"🍙",ingredients:["rongbien","ca","trung"],heat:2},
  {id:"banh-ca-rot",name:"Bánh cà rốt nghịch ngợm",icon:"🧁",ingredients:["carot","sua","matong"],heat:1},
  {id:"nam-mat-ong",name:"Nấm mật ong",icon:"🍄",ingredients:["nam","bo","matong"],heat:2}
]);
export const MODES = Object.freeze([
  {id:"normal",name:"Đơn hàng bình thường",help:"Làm đúng thứ tự ghi trên giấy."},
  {id:"reverse",name:"Món ăn đảo chiều",help:"Đầu bếp phải thêm nguyên liệu theo thứ tự đảo ngược."},
  {id:"zigzag",name:"Bếp đổi lửa",help:"Mỗi bước cần một mức lửa khác nhau theo giấy hướng dẫn."},
  {id:"shuffle",name:"Quán ăn xáo trộn",help:"Giấy ghi thứ tự đặc biệt do quán đề xuất."}
]);

function rng(seed) {
  let s=(Number(seed)>>>0)||0x517cc1b7;
  return function() {
    s^=s<<13;s^=s>>>17;s^=s<<5;
    return (s>>>0)/4294967296;
  };
}
function shuffle(values,next) {
  const result=values.slice();
  for(let i=result.length-1;i>0;i--){
    const j=Math.floor(next()*(i+1));
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}
export function roundPlan(round) {
  const dish=DISHES.find(d=>d.id===round.dish);
  const mode=MODES.find(m=>m.id===round.mode);
  if(!dish||!mode)return null;
  let ingredients=dish.ingredients.slice();
  if(mode.id==="reverse")ingredients.reverse();
  if(mode.id==="shuffle")ingredients=[ingredients[1],ingredients[2],ingredients[0]];
  return {dish,mode,steps:ingredients.map((ingredient,i)=>({
    ingredient,heat:mode.id==="zigzag" ? [dish.heat, (dish.heat%3)+1, ((dish.heat+1)%3)+1][i] : dish.heat
  }))};
}
export function newKitchenSession(seed) {
  const next=rng(seed);
  const dishes=shuffle(DISHES,next).slice(0,2);
  const modes=shuffle(MODES,next).slice(0,2);
  const rounds=dishes.map((dish,i)=>{
    const pool=INGREDIENTS.map(x=>x.id);
    const decoys=shuffle(pool.filter(x=>!dish.ingredients.includes(x)),next).slice(0,4);
    return {dish:dish.id,mode:modes[i].id,choices:shuffle(dish.ingredients.concat(decoys),next)};
  });
  return {version:1,phase:"brief",round:0,rounds,progress:0,heat:2,mistakes:0,results:[],prepared:null};
}
export function kitchenAction(state,action) {
  if(!state||!action||typeof action!=="object")return state;
  const current=state.rounds?.[state.round],plan=roundPlan(current||{});
  if(!plan)return state;
  if(action.type==="handoff"&&state.phase==="brief")
    return {...state,phase:"cooking"};
  if(action.type==="heat"&&state.phase==="cooking"&&Number.isInteger(action.value)&&action.value>=1&&action.value<=3)
    return {...state,heat:action.value};
  if(action.type==="ingredient"&&state.phase==="cooking") {
    const step=plan.steps[state.progress];
    if(!step||!current.choices.includes(action.value))return state;
    const success=step.ingredient===action.value&&step.heat===state.heat;
    if(success) {
      const progress=state.progress+1;
      if(progress<plan.steps.length)return {...state,progress};
      const result={dish:current.dish,success:true,score:Math.max(10,100-state.mistakes*20),mistakes:state.mistakes};
      return {...state,progress,phase:"result",prepared:result,results:[...state.results,result]};
    }
    const mistakes=state.mistakes+1;
    if(mistakes<3)return {...state,mistakes};
    const result={dish:current.dish,success:false,score:0,mistakes};
    return {...state,mistakes,phase:"result",prepared:result,results:[...state.results,result]};
  }
  if(action.type==="next"&&state.phase==="result"&&state.round===0)
    return {...state,phase:"brief",round:1,progress:0,heat:2,mistakes:0};
  if(action.type==="finish"&&state.phase==="result"&&state.round===1)
    return {...state,phase:"done"};
  return state;
}
export function totalScore(state) {
  return (state?.results||[]).reduce((sum,item)=>sum+item.score,0);
}
