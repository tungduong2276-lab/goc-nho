/* ================= v10 · đợt 4: đảo vương quốc 3D, quán cà phê, bến thuyền, lễ hội, thú, hoa, sticker, huy hiệu ================= */
// --- hoa: thêm 6 loại vào vòng xoay ---
FL3.push("camchuong","baby","lan","hoagiay","luuly","maivang");
Object.assign(FL3N,{camchuong:"Cẩm chướng",baby:"Hoa baby",lan:"Lan hồ điệp",hoagiay:"Hoa giấy",luuly:"Lưu ly",maivang:"Mai vàng"});
function careNow(){const cs=careStats(),stage=cs.bothCount%10,pots=Math.floor(cs.bothCount/10),wilt=cs.dry!==null&&cs.dry>=3;return{cs,stage,pots,wilt,type:FL3[pots%FL3.length],gd:careGd(stage,wilt)};}
function sill3D(pots){return Array.from({length:pots},(_,i)=>`<span><img src="${A3(`hoa_${FL3[i%FL3.length]}_gd5`)}" alt="${FL3N[FL3[i%FL3.length]]}"></span>`).join("");}

// --- sticker 3D, giữ nguyên mã cũ ---
Object.keys(STK).forEach(k=>{STK[k]=`<img src="${A3("sticker_"+k)}" alt="" draggable="false">`;});
["vaytay","omtim","khocnhe","gian","dingu","nhoqua"].forEach(k=>["anh","em"].forEach(w=>{const id=`me_${w}_${k}`;STK[id]=`<img src="${A3("sticker_"+id)}" alt="" draggable="false">`;
  STK_NAME[id]=({vaytay:"vẫy tay",omtim:"ôm tim",khocnhe:"khóc nhè",gian:"giận phồng má",dingu:"đi ngủ",nhoqua:"nhớ quá"})[k]+(w==="anh"?" (cậu bé)":" (cô bé)");}));

// --- lễ hội ---
function festNow(d=new Date()){
  const md=(m,dd)=>d.getMonth()+1===m&&d.getDate()===dd,ds=dayStart(d),near=(iso,a,b)=>{if(!iso)return false;const t=(ds-parseDay(iso))/864e5;return t>=a&&t<=b;};
  const y=d.getFullYear(),out=[];
  [0,1].forEach(i=>{const b=(S.meta.bday||[])[i];if(b){const x=parseDay(b);if(x&&x.getMonth()===d.getMonth()&&x.getDate()===d.getDate())out.push({k:"sinhnhat_"+CH(i),who:i,t:"Chúc mừng sinh nhật "+S.meta.names[i]+"!"});}});
  const st=parseDay(S.meta.startDate);if(st){const n=Math.round((ds-st)/864e5)+1;if((st.getMonth()===d.getMonth()&&st.getDate()===d.getDate()&&y>st.getFullYear())||(n>0&&n%100===0))out.push({k:"kyniem",t:n%100===0?`Ngày thứ ${n} bên nhau`:`Kỷ niệm ${y-st.getFullYear()} năm bên nhau`});}
  if(near(TET[y],-3,3)||near(TET[y+1],-3,3))out.push({k:"tet",t:"Chúc mừng năm mới"});
  if(near(TRUNGTHU[y],-2,1))out.push({k:"trungthu",t:"Trung thu vui vẻ"});
  if(d.getMonth()===1&&d.getDate()>=13&&d.getDate()<=15)out.push({k:"valentine",t:"Lễ Tình nhân"});
  if(d.getMonth()===11&&d.getDate()>=20&&d.getDate()<=26)out.push({k:"noel",t:"Giáng sinh an lành"});
  return out;
}
const FEST1=()=>festNow()[0]||null;
// phụ kiện theo dịp: mũ Noel, mũ sinh nhật (chỉ khi chưa tự chọn mũ)
const _lookOf=lookOf;lookOf=function(i){const L=_lookOf(i),f=festNow();if(L.hat==="khong"||!L.hat){if(f.some(x=>x.k==="sinhnhat_"+CH(i)))L.hat="musinhnhat";else if(f.some(x=>x.k==="noel"))L.hat="munoel";}return L;};
function festLayer(key,where,z){const n=`le_${key}_${where}`,b=SC3.fest&&SC3.fest[n];if(!b)return"";return`<img class="spr fest" src="${A3(n)}" alt="" style="${PX(b[0],b[1],b[2]-b[0],b[3]-b[1],z)}">`;}
function festFx(f,night){if(!f)return"";let h="";if(night&&(f.k==="tet"||f.k==="kyniem"))h+=`<div class="fx-fire${f.k==="kyniem"?" heart":""}" aria-hidden="true"><i></i><i></i><i></i></div>`;if(f.k==="trungthu")h+=`<div class="fx-moon" aria-hidden="true"></div>`;return h;}

// bản đồ: thêm lớp lễ hội + chữ chúc mừng
const _wm=worldMapHTML;worldMapHTML=function(){let h=_wm();const f=FEST1();if(!f||!SC3||!SC3.fest)return h;
  h=h.replace('<div class="msign"',festLayer(f.k,"bando",1300)+'<div class="msign"').replace('<div class="w-time">',festFx(f,buoi()==="dem")+`<div class="w-fest">${esc(f.t)}</div><div class="w-time">`);return h;};
const _rh=roomHTML;roomHTML=function(){let h=_rh();const f=FEST1();if(!f||!SC3||!SC3.fest)return h;return h.replace('<img class="wbg"',`${festLayer(f.k,"phongkhach",765)}<img class="wbg"`);};

// --- thú cưng nhiều loài ---
const PET_SP=()=>Object.assign({meo:{name:"Mèo",colors:{trang:"Trắng",cam:"Cam mướp",xam:"Xám xanh"}}},SC3&&SC3.pets||{});
function petImg(p,s){const pose=s==="ngu"?"nam":s==="vui"?"vui":"ngoi",sp=p.species||"meo";return sp==="meo"?`thu_meo_${p.color||"trang"}_${pose}`:`thu_${sp}_${p.color}_${pose}`;}
function petCardHTML(){
  if(ME===null||!SC3)return"";const p=S.pet&&S.pet.main,SP=PET_SP();
  const picker=(cur)=>`<div class="field">Loài<div class="seg">${Object.entries(SP).map(([k,v])=>`<label><input type="radio" name="petsp" value="${k}" ${(cur.species||"meo")===k?"checked":""}><span>${v.name}</span></label>`).join("")}</div></div>
    <div class="field">Màu lông<div class="seg" id="petcols">${Object.entries(SP[cur.species||"meo"].colors).map(([k,v],i)=>`<label><input type="radio" name="petcol" value="${k}" ${(cur.color?cur.color===k:!i)?"checked":""}><span>${v}</span></label>`).join("")}</div></div>
    <div class="petpick">${Object.keys(SP[cur.species||"meo"].colors).map(k=>`<img src="${A3(petImg({species:cur.species||"meo",color:k},"ok"))}" alt="">`).join("")}</div>`;
  if(!p)return`<section class="blk" id="petCard"><div><h2 class="v3h">Nuôi chung một bé thú</h2><p class="v3sub">Bé ở phòng khách, đói thì đòi ăn, lâu không tắm thì lấm lem, ai lâu không về thì bé nhớ.</p></div>
    <form class="formcard" id="petNew"><label class="field">Tên bé<input id="pet-name" maxlength="16" placeholder="Ví dụ: Bánh Bao" required></label>${picker(petDraft)}<button class="btn btn-main">Đón bé về nhà</button></form></section>`;
  const s=petState(),line=k=>p[k]&&p[k].at?`${N(p[k].by)} · ${ago(p[k].at)}`:"chưa có",sp=SP[p.species||"meo"];
  return`<section class="blk" id="petCard"><div><h2 class="v3h">${esc(p.name)} ${PET_TXT[s]}</h2><p class="v3sub">${sp.name} ${(sp.colors[p.color]||"").toLowerCase()} của ${N(0)} và ${N(1)} · ${petStreak(p)} ngày liền được chăm</p></div>
    <div class="petcard"><img class="petimg${Date.now()-petHop<1500?" hop":""}" src="${A3(petImg(p,s))}" alt="">
      <ul class="petlog"><li><b>Cho ăn</b><span>${line("fed")}</span></li><li><b>Tắm</b><span>${line("bath")}</span></li><li><b>Vuốt ve</b><span>${line("pat")}</span></li></ul></div>
    <div class="row petbtns"><button class="btn btn-main btn-small" data-pet="fed">Cho ăn</button><button class="btn btn-ghost btn-small" data-pet="bath">Tắm</button><button class="btn btn-ghost btn-small" data-pet="pat">Vuốt ve</button></div>
    <details class="fold" id="petChange"><summary>Đổi loài, màu lông hoặc tên</summary><form class="v3form" id="petEdit"><label class="field">Tên bé<input id="pet-name2" maxlength="16" value="${esc(p.name)}"></label>${picker(petDraft.species?petDraft:p)}<button class="btn btn-ghost btn-small">Lưu</button></form></details></section>`;
}
let petDraft={};
const petStreak=p=>{const d=p&&p.days||{};let n=0,x=dayStart(new Date());if(!d[dkey(x)])x=prevDay(x);while(d[dkey(x)]){n++;x=prevDay(x);}return n;};
const _petAct=petAct;petAct=function(kind){const before=(S.pet.main||{})[kind];_petAct(kind);const p=S.pet.main;if(p&&p[kind]!==before){const days=Object.assign({},p.days||{});days[dkey()]=1;const keys=Object.keys(days).sort();while(keys.length>70)delete days[keys.shift()];put("pet",Object.assign({},p,{days}));}};
// cập nhật hình bé thú ở phòng khách và bản đồ
const _rh2=roomHTML;roomHTML=function(){let h=_rh2();const p=S.pet&&S.pet.main;if(!p||!p.species||p.species==="meo")return h;return h.replace(/thu_meo_[a-z]+_(ngoi|nam|vui)/g,(m,pose)=>`thu_${p.species}_${p.color}_${pose}`);};
const _wm2=worldMapHTML;worldMapHTML=function(){let h=_wm2();const p=S.pet&&S.pet.main;if(!p||!p.species||p.species==="meo")return h;return h.replace(/thu_meo_[a-z]+_(ngoi|nam|vui)/g,(m,pose)=>`thu_${p.species}_${p.color}_${pose}`);};
const _rr=renderRoom;renderRoom=function(){_rr();const root=$("tab-room");if(!root)return;
  root.querySelectorAll('input[name="petsp"]').forEach(r=>r.onchange=()=>{petDraft={species:r.value,color:Object.keys(PET_SP()[r.value].colors)[0]};const ed=$("petChange");rerender();const e2=$("petChange");if(e2)e2.open=true;});
  root.querySelectorAll('input[name="petcol"]').forEach(r=>r.onchange=()=>{petDraft=Object.assign({},petDraft,{color:r.value});});
  const pn=$("petNew");if(pn)pn.onsubmit=e=>{e.preventDefault();const name=$("pet-name").value.trim()||"Bánh Bao",sp=(pn.querySelector('input[name="petsp"]:checked')||{}).value||"meo",c=(pn.querySelector('input[name="petcol"]:checked')||{}).value||Object.keys(PET_SP()[sp].colors)[0];
    put("pet",{id:"main",name,species:sp,color:c,born:nowIso(),by:ME,fed:{at:nowIso(),by:ME},days:{[dkey()]:1}});petDraft={};toast("Chào mừng "+name+" về nhà!");};
  const pe=$("petEdit");if(pe)pe.onsubmit=e=>{e.preventDefault();const sp=(pe.querySelector('input[name="petsp"]:checked')||{}).value||"meo",c=(pe.querySelector('input[name="petcol"]:checked')||{}).value;
    put("pet",Object.assign({},S.pet.main,{name:$("pet-name2").value.trim()||S.pet.main.name,species:sp,color:c||Object.keys(PET_SP()[sp].colors)[0]}));petDraft={};toast("Đã lưu");};
};

// --- huy hiệu thành tích ---
function badgesEarned(){
  const st=parseDay(S.meta.startDate),dn=st?Math.round((dayStart(new Date())-st)/864e5)+1:0,cn=careNow(),done=closedCount();
  const lau=list("realm").some(b=>b.type==="lau"&&b.built),p=S.pet&&S.pet.main;
  return{tram_ngay:dn>=100,mot_nam:dn>=365,hen_10:done>=10,hen_50:done>=50,hoa_dau:cn.pots>=1,vuon_day:cn.pots>=11,nhan_100:list("fridge").length>=100,
    truyen_20:list("story").some(s=>(s.lines||[]).length>=20),tranh_dau:list("drawings").some(d=>d.done),lau_dai:lau,kho_bau_10:list("treasures").filter(t=>t.found).length>=10,cham_thu_30:!!p&&petStreak(p)>=30};
}
function badgesHTML(){if(!SC3||!SC3.medals)return"";const E=badgesEarned(),n=Object.values(E).filter(Boolean).length;
  return`<section class="blk" id="badges"><div><h2 class="v3h">Huy hiệu của hai đứa · ${n}/12</h2><p class="v3sub">Tự mở khoá theo những gì hai bạn làm cùng nhau.</p></div>
    <div class="badges">${Object.entries(SC3.medals).map(([k,t])=>`<figure class="badge${E[k]?"":" locked"}"><img src="${A3(E[k]?"huy_hieu_"+k:"huy_hieu_khoa")}" alt=""><figcaption>${esc(t)}</figcaption></figure>`).join("")}</div></section>`;}
let badgeSeen=(()=>{try{return JSON.parse(localStorage.getItem("gn-badges")||"null");}catch(e){return null;}})();
function badgeCheck(){if(!SC3||!SC3.medals||!dbReadyOrLocal())return;const E=badgesEarned(),now=Object.keys(E).filter(k=>E[k]);
  if(badgeSeen===null){badgeSeen=now;try{localStorage.setItem("gn-badges",JSON.stringify(now));}catch(e){}return;}
  const fresh=now.filter(k=>!badgeSeen.includes(k));if(fresh.length){badgeSeen=now;try{localStorage.setItem("gn-badges",JSON.stringify(now));}catch(e){}toast("Mở khoá huy hiệu: "+SC3.medals[fresh[0]]);}}
const dbReadyOrLocal=()=>MODE!=="db"||dbReady;

// --- phòng: quán cà phê, bến thuyền; gác có huy hiệu ---
Object.assign(ROOM_TAB,{"quan-ca-phe":"quan_ca_phe","ben-thuyen":"ben_thuyen"});
Object.assign(ROOM_HINT,{quan_ca_phe:"Chạm hũ thẻ to để bốc thăm, bảng menu để xem tất cả các trò. Ban đêm quầy kéo rèm.",ben_thuyen:"Chạm thuyền để chèo sang đảo vương quốc."});
const _itemState=itemState;itemState=function(r,k){const f=flashObj[r+"."+k];if(f&&Date.now()-f.at<(f.ms||900))return f.st;const t=buoi();
  if(k==="quay")return t==="dem"?"dong":"mo";if(k==="hu"&&r==="quan_ca_phe")return available([]).length>=10?"day":"voi";if(k==="denlong")return t==="dem"||t==="chieu"?"sang":"tat";
  if(k==="kesuutap")return"trong";return _itemState(r,k);};
const _roomItem=roomItem;roomItem=function(r,key){const go=SC3.rooms[r].items[key].go;
  if(go==="cheo"){flashObj[r+"."+key]={st:"cheo",at:Date.now(),ms:1500};schedule();toast("Hai đứa chèo thuyền sang đảo...");setTimeout(()=>{location.hash="vuong-quoc";kgView="map";},1400);return;}
  if(go==="menu"){location.hash="hom-nay";setTimeout(()=>{const d=$("allDetails");if(d){d.open=true;d.scrollIntoView({behavior:reduced()?"auto":"smooth"});}},350);return;}
  if(go==="ngoi"){toast("Hai ghế cao đang chờ hai đứa. Bốc một lá trong hũ rồi ngồi chơi nhé");return;}
  if(go==="den"){toast(buoi()==="dem"?"Đèn lồng sáng cả bến":"Đèn lồng sẽ sáng khi trời tối");return;}
  if(key==="kesuutap"){location.hash="gac";setTimeout(()=>{const b=$("badges");if(b)b.scrollIntoView({behavior:reduced()?"auto":"smooth"});},350);return;}
  return _roomItem(r,key);};
const _rr2=renderRooms;renderRooms=function(){_rr2();
  const g=$("tab-gac");if(g&&!$("v-gac").hidden&&!g.querySelector("#badges"))g.insertAdjacentHTML("beforeend",badgesHTML());
  const c=$("tab-quan-ca-phe");if(c&&!$("v-quan-ca-phe").hidden&&SC3&&SC3.rooms){const sp=SC3.rooms.quan_ca_phe.spots.menu;const names=pickN(available([]),4).map(x=>esc(x.name));
    const cv=c.querySelector(".wcanvas");if(cv&&sp&&names.length)cv.insertAdjacentHTML("beforeend",`<div class="chalk" style="left:${sp[0][0]}px;top:${sp[0][1]}px">${names.map(n=>`<span>${n}</span>`).join("")}</div>`);
    if(!c.querySelector(".room-acts"))c.insertAdjacentHTML("beforeend",`<div class="room-acts"><a class="btn btn-main btn-small" href="#hom-nay">Bốc thăm ở hũ hẹn hò</a><a class="btn btn-ghost btn-small" href="#nhat-ky">Nhật ký hẹn hò</a></div>`);}
  const b=$("tab-ben-thuyen");if(b&&!$("v-ben-thuyen").hidden&&!b.querySelector(".room-acts"))b.insertAdjacentHTML("beforeend",`<div class="room-acts"><button type="button" class="btn btn-main btn-small" data-ri="thuyen">Chèo thuyền sang đảo</button></div>`),b.querySelectorAll(".room-acts [data-ri]").forEach(x=>x.onclick=()=>roomItem("ben_thuyen","thuyen"));
};
const _zoneGo=zoneGo;zoneGo=function(k){if(k==="cafe"){location.hash="quan-ca-phe";return;}if(k==="ben"){location.hash="ben-thuyen";return;}return _zoneGo(k);};
["quan-ca-phe","ben-thuyen"].forEach(t=>{NAVG[0].tabs.push(t);TABS.push(t);});Object.assign(TABNAME,{"quan-ca-phe":"Quán cà phê","ben-thuyen":"Bến thuyền"});

// --- đảo vương quốc 3D ---
function treasury(){
  const days={};list("care").forEach(c=>{(days[c.day]=days[c.day]||[0,0])[c.who]=1;});
  const earn=50+hist().filter(h=>h.closed).length*30+list("drawings").filter(d=>d.done).length*15
    +Object.values(days).filter(d=>d[0]&&d[1]).length*10+list("treasures").filter(t=>t.found).length*10
    +list("letters").length*5+list("kingdom").filter(k=>k.status==="ok").length*5
    +list("fridge").length*3+list("story").reduce((t,s)=>t+(s.lines||[]).length*2,0);
  const spent=list("realm").reduce((t,b)=>t+((BLD[b.type]||{}).cost||0)*(b.lv===2?2:1),0);
  return{earn,spent,bal:earn-spent};
}
function realmStats(){
  const all=list("realm"),built=all.filter(x=>x.built||x.lv===2),K=kingdomOfficial(),f=x=>x.lv===2&&x.built?1.5:1;
  const pop=2+built.reduce((t,x)=>t+Math.round(((BLD[x.type]||{}).pop||0)*f(x)),0),joy=built.reduce((t,x)=>t+Math.round(((BLD[x.type]||{}).joy||0)*f(x)),0);
  const score=pop+joy+K.laws.length*3+K.hol.length*3+list("medals").length*2;
  let ri=0;RANKS.forEach((r,i)=>{if(score>=r[0])ri=i;});
  return{pop,joy,score,rank:RANKS[ri][1],cur:RANKS[ri][0],next:RANKS[ri+1]||null,built:all.filter(x=>x.built).length,wip:all.filter(x=>!x.built).length};
}
const KGP=(gx,gy)=>{const m=SC3.kg,o=m.o,ex=m.ex,ez=m.ez;return[o[0]+(ex[0]-o[0])*gx+(ez[0]-o[0])*gy,o[1]+(ex[1]-o[1])*gx+(ez[1]-o[1])*gy];};
function kgSpr(name,gx,gy,z,cls="",sc=1){const m=SC3.kg,b=m.boxes[name];if(!b)return"";const big=/_(rap|lau)_|dangxay_lon/.test(name),f=big?m.spb:m.sp,p=KGP(gx,gy);
  return`<img class="spr ${cls}" src="${A3("kg_"+name)}" alt="" draggable="false" style="${PX(p[0]+(b[0]-f.ax)*sc,p[1]+(b[1]-f.ay)*sc,(b[2]-b[0])*sc,(b[3]-b[1])*sc,z)}">`;}
const LITB=["den","thap","nha","tra","banh"];
function realmSVG(){
  if(!SC3||!SC3.kg)return`<div class="isle3d"><p class="quiet" style="padding:20px">Đang dựng đảo...</p></div>`;
  const m=SC3.kg,t=buoi(),night=t==="dem",at={},all=list("realm");all.forEach(b=>{if(b.x<RG&&b.y<RG)at[b.x+"-"+b.y]=b;});
  const isRoad=(x,y)=>{const b=at[x+"-"+y];return b&&b.type==="duong";};
  let h="";const cells=[];for(let y=0;y<RG;y++)for(let x=0;x<RG;x++)cells.push([x,y]);cells.sort((a,b)=>(a[0]+a[1])-(b[0]+b[1])||a[0]-b[0]);
  cells.forEach(([x,y])=>{const b=at[x+"-"+y],z=Math.round(KGP(x+.5,y+.5)[1]);
    if(!b){const sd=seed(x,y);if(sd%9===0)h+=kgSpr("o_hoadai",x+.5,y+.5,z-60);else if(sd%13===0)h+=kgSpr("o_da",x+.5,y+.5,z-60);return;}
    if(b.type==="duong"){const mask=(isRoad(x,y-1)?1:0)|(isRoad(x+1,y)?2:0)|(isRoad(x,y+1)?4:0)|(isRoad(x-1,y)?8:0);h+=kgSpr("duong_"+mask,x+.5,y+.5,z-80,b.built?"":"wipr");return;}
    const lv=b.lv===2&&b.built?2:1,lit=night&&LITB.includes(b.type)?"_sang":"",big=b.type==="rap"||b.type==="lau";
    if(b.built||b.lv===2)h+=kgSpr(`ct_${b.type}_capdo${lv}${lit}`,x+.5,y+.5,z,"",1.12);
    if(!b.built)h+=kgSpr(big?"ct_dangxay_lon":"ct_dangxay",x+.5,y+.5,z+1,b.lv===2?"upg":"",1.12);});
  // cư dân, gà vịt, thuyền buồm
  const R=realmStats(),roads=all.filter(b=>b.type==="duong"&&b.built),empty=cells.filter(([x,y])=>!at[x+"-"+y]),spots=roads.length?roads.map(b=>[b.x,b.y]):empty;
  const nRes=Math.min(4,Math.max(1,Math.floor(R.pop/3)));
  for(let i=0;i<nRes&&spots.length;i++){const s=spots[(seed(i+3,7)+i*5)%spots.length];h+=kgSpr("cu_dan_"+(i+1),s[0]+.5+(i%2?.18:-.18),s[1]+.5,Math.round(KGP(s[0]+.5,s[1]+.5)[1])+5,"walker w"+i,0.9);}
  all.filter(b=>b.built&&b.type==="ruong").slice(0,2).forEach((b,i)=>{h+=kgSpr("ga",b.x+.95,b.y+.35,Math.round(KGP(b.x+1,b.y+.4)[1]),"peck",0.8);});
  all.filter(b=>b.built&&b.type==="ho").slice(0,2).forEach(b=>{h+=kgSpr("vit",b.x+1.0,b.y+.9,Math.round(KGP(b.x+1,b.y+1)[1]),"peck",0.8);});
  const poly=(x,y)=>[KGP(x,y),KGP(x+1,y),KGP(x+1,y+1),KGP(x,y+1)].map(p=>p.map(v=>v.toFixed(1)).join(",")).join(" ");
  let svg=`<svg class="kgz" viewBox="0 0 ${m.size[0]} ${m.size[1]}">`;cells.forEach(([x,y])=>{const k=x+"-"+y;svg+=`<polygon class="gt${selTile===k?" sel":""}" data-tile="${k}" points="${poly(x,y)}"/>`;});svg+="</svg>";
  return`<div class="isle3d t-${t}"><div class="w3fit" data-w="${m.size[0]}" style="aspect-ratio:${m.size[0]}/${m.size[1]}"><div class="wcanvas" style="width:${m.size[0]}px;height:${m.size[1]}px">
    <img class="wbg" src="${A3("dao_"+t)}" alt="Đảo vương quốc" draggable="false"><div class="sail">${kgSpr("thuyen_buom",8.9,3.5,1,"",1)}</div>${svg}${h}</div></div>${fx()}</div>`;
}
const _rhf=realmHostFill;realmHostFill=function(){_rhf();fit3();setTimeout(fit3,30);};
Object.keys(BLD).forEach(k=>{BLD_SVG[k]=k==="duong"?`<img src="${A3("kg_duong_10")}" alt="">`:`<img src="${A3("kg_ct_"+k+"_capdo1")}" alt="">`;});
// nâng cấp lên cấp 2
const _tp=tilePanel;tilePanel=function(T){let h=_tp(T);const b=selTile&&list("realm").find(r=>r.x+"-"+r.y===selTile);if(!b||b.type==="duong"||ME===null)return h;
  const d=BLD[b.type]||{cost:0};
  if(b.built&&b.lv!==2)h=h.replace('<button class="linkish" data-tclose="1">',`<button class="btn btn-ghost btn-small" data-bup="${b.id}" ${T.bal<d.cost?"disabled":""}>Nâng lên cấp 2 · ${d.cost} xu</button><button class="linkish" data-tclose="1">`);
  if(b.lv===2)h=h.replace("<b>"+d.t+"</b>","<b>"+d.t+" · cấp 2</b>").replace("+"+d.pop+" dân · +"+d.joy+" hạnh phúc",`+${Math.round(d.pop*1.5)} dân · +${Math.round(d.joy*1.5)} hạnh phúc`);
  if(b.lv===2&&!b.built)h=h.replace(/đặt móng [^·]*· chờ/,`bắt đầu nâng cấp · chờ`);
  return h;};
document.addEventListener("click",e=>{const u=e.target.closest&&e.target.closest("[data-bup]");if(!u)return;const b=S.realm[u.dataset.bup];if(!b)return;
  put("realm",Object.assign({},b,{lv:2,built:false,by:ME,date:nowIso()}));toast("Đã bắt đầu nâng cấp. Chờ "+S.meta.names[OTHER()]+" góp tay là xong");rerender();});

const _rv3c=renderV3;renderV3=function(){_rv3c();setTimeout(badgeCheck,0);};
{const _sc=setInterval(()=>{if(SC3&&SC3.kg){realmSig=null;clearInterval(_sc);schedule();}},300);}
