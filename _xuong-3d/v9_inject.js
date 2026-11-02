/* ================= v9 · phối đồ + 5 phòng phóng to ================= */
// --- nhân vật ghép từ nhiều lớp ---
const LOOK_KEYS=["hair","hc","top","bot","hat","acc"];
function lookOf(i){const R=SC3&&SC3.rig;const def=R?R.defaults[CH(i)]:{};const mine=(S.meta.looks||{})[i]||{};return Object.assign({},def,mine);}
function exprOf(i){const st=stOf(i);if(st==="ngu")return"ngu";const p=PRES(i);if(p&&p.mood&&Date.now()-new Date(p.moodAt||0)<16*3600e3)return p.mood;return CH(i)==="anh"?"cuoi":"vui";}
function stackParts(look,pose,ex){const P=pose==="ngu"?"dung":pose;
  const L=["nv_than_"+P,`nv_quan_${look.bot}_${P}`,`nv_ao_${look.top}_${P}`,`nv_mat_${ex}_${P}`,`nv_toc_${look.hair}_${look.hc}_${P}`];
  if(look.hat&&look.hat!=="khong")L.push(`nv_mu_${look.hat}_${P}`);if(look.acc&&look.acc!=="khong")L.push(`nv_pk_${look.acc}_${P}`);return L;}
// một nhân vật trong khung 512 (đơn vị pixel của cảnh), neo chân tại pt
function charStack(i,pose,pt,scale,z,cls="",o={}){
  const R=SC3.rig,s=scale,look=o.look||lookOf(i),ex=o.expr||(pose==="ngu"?"ngu":exprOf(i));
  const imgs=stackParts(look,pose,ex).filter(n=>R.boxes[n]).map(n=>{const b=R.boxes[n];return`<img src="${A3(n)}" alt="" draggable="false" style="left:${(b[0]/5.12).toFixed(2)}%;top:${(b[1]/5.12).toFixed(2)}%;width:${((b[2]-b[0])/5.12).toFixed(2)}%;height:${((b[3]-b[1])/5.12).toFixed(2)}%">`;}).join("");
  const a=R.anchor;
  return`<span class="cstack spr ${cls}" style="${PX(pt[0]-a[0]*s,pt[1]-a[1]*s,512*s,512*s,z)}">${imgs}</span>`;
}

// --- bản đồ: nhân vật nhiều lớp, khu nào cũng vào được phòng ---
function worldMapHTML(){
  if(!SC3||!SC3.rig)return`<div class="world w-loading"><p class="quiet">Đang mở ngôi nhà...</p></div>`;
  const M=SC3.map,t=buoi(),o=OTHER(),k=M.ppm/SC3.rig.ppm,fk=M.plotPpm/SC3.flower.ppm;
  const st=parseDay(S.meta.startDate),dayN=st?Math.round((dayStart(new Date())-st)/864e5)+1:null;
  let chars="";
  if(ME!==null)[ME,o].forEach(i=>{const p=placeOnMap(i);chars+=charStack(i,p.pose,p.pt,k*1.15,p.pt[1],"m-ch"+(p.st==="vang"?" ghost":""));});
  const pet=S.pet&&S.pet.main;if(pet)chars+=sprite(`thu_meo_${pet.color||"trang"}_${petState()==="ngu"?"nam":"ngoi"}`,M.pet_door,k*1.1,M.pet_door[1]);
  const cn=careNow();let fl="";
  M.plots.forEach((p,i)=>{let f=null;if(i===0)f=`hoa_${cn.type}_${cn.gd}`;else if(i<=cn.pots)f=`hoa_${FL3[(i-1)%6]}_gd5`;if(f)fl+=sprite(f,p,fk*1.05,p[1],"m-fl",SC3.flower.anchor,256);});
  const Z=M.zones,lbl=["khach","bep","sangtao","anh","em","gac","vuon","hopthu","cafe","dao"];
  const cen=pts=>{let x=0,y=0;pts.forEach(p=>{x+=p[0];y+=p[1];});return[x/pts.length,y/pts.length];};
  const pres=ME===null?"":isHere(o)?`<span class="live"></span>${N(o)} cũng đang ở nhà`:stOf(o)==="ngu"?`${N(o)} đi ngủ rồi`:stOf(o)==="ban"?`${N(o)} đang bận`:PRES(o)?`${N(o)} ghé lần cuối ${ago(PRES(o).last)}`:`${N(o)} chưa ghé nhà`;
  return`<div class="world t-${t}" aria-label="Bản đồ ngôi nhà">
    <div class="sky" aria-hidden="true">${[1,2,3].map(i=>`<img class="cloud c${i}" src="${A3("may_"+i)}" alt="">`).join("")}</div>
    <div class="wstage w3fit" data-w="${M.size[0]}"><div class="wcanvas" style="width:${M.size[0]}px;height:${M.size[1]}px">
      <img class="wbg" src="${A3("ban_do_"+t)}" alt="Ngôi nhà Góc Nhỏ của ${N(0)} và ${N(1)}" draggable="false">
      ${fl}${chars}
      <div class="msign" style="left:${M.sign[0]}px;top:${M.sign[1]}px">Góc Nhỏ</div>
      <svg class="zones" viewBox="0 0 ${M.size[0]} ${M.size[1]}">${Object.entries(Z).map(([k2,z])=>`<polygon points="${z.poly.map(p=>p.join(",")).join(" ")}" data-zone="${k2}" tabindex="0" role="link" aria-label="${esc(zoneName(k2))}"><title>${esc(zoneName(k2))}</title></polygon>`).join("")}</svg>
      ${lbl.map(k2=>{const c=cen(Z[k2].poly),top=Math.min(...Z[k2].poly.map(p=>p[1]));const y=["vuon","hopthu","cafe","dao"].includes(k2)?top-6:top+34;return`<span class="zlbl" style="left:${c[0]}px;top:${y}px">${esc(zoneName(k2))}</span>`;}).join("")}
    </div></div>${fx()}
    ${dayN?`<div class="w-day"><b>${dayN}</b><span>ngày bên nhau</span></div>`:""}
    <div class="w-time">${BUOI_TXT[t]}${raining()?" · trời mưa":""}</div>
    ${ME!==null?`<p class="w-pres">${pres}</p>`:""}
  </div>
  <p class="sc-hint">Chạm vào một phòng để vào. Mỗi phòng có đồ vật chạm được.</p>`;
}
const ownerOf=ch=>(S.meta.chars||["anh","em"])[0]===ch?0:1;
function zoneName(k){if(k==="anh"||k==="em")return"Phòng "+N(ownerOf(k));return SC3.map.zones[k].name;}
function zoneGo(k){
  const map={khach:"phong-khach",bep:"bep",sangtao:"goc-sang-tao",gac:"gac",anh:"phong-anh",em:"phong-em",vuon:"khu-vuon",hopthu:"thu",cafe:"hom-nay",ben:"vuong-quoc",dao:"vuong-quoc"};
  location.hash=map[k]||"nha";
}
function roomHTML(){ // phòng khách, giờ dùng nhân vật nhiều lớp
  if(!SC3||!SC3.rig)return`<p class="quiet">Đang mở phòng khách...</p>`;
  const R=SC3.room,L=R.layers,t=buoi(),o=OTHER(),k=R.ppm/SC3.rig.ppm*1.3;
  const st0=parseDay(S.meta.startDate),dayN=st0?Math.round((dayStart(new Date())-st0)/864e5)+1:null;
  const lay=(n,z,act,label)=>{const b=L[n];const img=`<img src="${A3(n)}" alt="" draggable="false">`;
    return act?`<button type="button" class="lay hot" data-r="${act}" aria-label="${label}" style="${PX(b[0],b[1],b[2]-b[0],b[3]-b[1],z)}">${img}</button>`:`<span class="lay" style="${PX(b[0],b[1],b[2]-b[0],b[3]-b[1],z)}">${img}</span>`;};
  const w=ME!==null?waiting():{},notes=!!(w.fridgeNew||list("taps").some(x=>x.to===ME&&Date.now()-new Date(x.at)<864e5));
  const ph=latestPhoto();
  let html=lay("pk_sofa",L.pk_sofa[3],"sofa","Sofa đôi: ngồi cạnh nhau")+lay("pk_khung_anh",3,"anh","Khung ảnh: mở bảo tàng kỷ niệm")+lay("pk_lich",3,"lich","Lịch đếm ngày")
    +lay(notes?"pk_bang_ghim_giay":"pk_bang_ghim_trong",3,"ghim","Bảng ghim: gửi một cái chạm")+lay(radioOn?"pk_radio_phat":"pk_radio_tat",L.pk_radio_tat[3],"radio","Đài radio: bài hát của hai đứa")
    +lay("pk_hu_"+jarState(),L.pk_hu_day[3],"hu","Hũ hẹn hò: bốc thăm")+(raining()?lay("pk_cuaso_mua",4,null):"");
  html+=`<div class="onwall cal" style="transform:${quadM(R.lichQuad,130,100)}"><b>${dayN||"?"}</b><span>${dayN?"ngày":"thêm ngày"}</span></div>`;
  html+=`<div class="onwall photo" style="transform:${quadM(R.anhQuad,140,100)}">${ph?`<img src="${esc(ph)}" alt="">`:`<i>♥</i>`}</div>`;
  if(radioOn)html+=`<div class="notes" style="left:${R.radioTop[0]}px;top:${R.radioTop[1]}px" aria-hidden="true"><i>♪</i><i>♫</i><i>♪</i></div>`;
  if(ME!==null){
    const seat=i=>R.ghe[CH(i)==="anh"?0:1];
    const meSit=sits(ME),oSit=sits(o),oHere=isHere(o),oSt=stOf(o);
    const mePose=meSit?"ngoi":Date.now()-waveMe<1600?"vaytay":stOf(ME)==="ngu"?"ngu":"dung",mePt=meSit?seat(ME):R.dung[0];
    html+=`<button type="button" class="chr" data-rme="1" aria-label="${N(ME)}" style="z-index:${Math.round(meSit?L.pk_sofa[3]+6:mePt[1])}">${charStack(ME,mePose,mePt,k,null)}<span class="ctag c-${CH(ME)}" style="left:${mePt[0]}px;top:${mePt[1]+8}px">${N(ME)}</span></button>`;
    if(oSt!=="ngu"||oHere){const oPt=oSit?seat(o):R.dung[1],oPose=oSit?"ngoi":oHere?"vaytay":"dung";
      html+=`<button type="button" class="chr${oHere?"":" ghost"}" data-rhug="1" aria-label="Ôm ${N(o)}" style="z-index:${Math.round(oSit?L.pk_sofa[3]+(CH(o)==="em"?7:5):oPt[1])}">${charStack(o,oPose,oPt,k,null)}<span class="ctag c-${CH(o)}" style="left:${oPt[0]}px;top:${oPt[1]+8}px">${N(o)}${oHere?"":`<small> · ${oSt==="ban"?"đang bận":"đi vắng"}</small>`}</span></button>`;}
  }
  const pet=S.pet&&S.pet.main;
  if(pet){const s=petState();html+=`<button type="button" class="chr pet${Date.now()-petHop<1500?" hop":""}" data-rpet="1" aria-label="${esc(pet.name)}" style="z-index:${Math.round(R.thu[1])}">${sprite(`thu_meo_${pet.color||"trang"}_${s==="ngu"?"nam":s==="vui"?"vui":"ngoi"}`,R.thu,k*0.95,null)}
    ${BUB[s]?`<span class="bubble" style="left:${R.thu[0]}px;top:${R.thu[1]-150}px"><svg viewBox="0 0 24 24" stroke="#1D2B4F" stroke-width="1.6">${BUB[s]}</svg></span>`:""}</button>`;}
  return`<div class="room3d t-${t}"><div class="w3fit rstage" data-w="${R.size[0]}"><div class="wcanvas" style="width:${R.size[0]}px;height:${R.size[1]}px">
      <img class="wbg" src="${A3("phong_khach_"+t)}" alt="Phòng khách" draggable="false">${html}</div></div>${fx()}</div>`;
}

// --- 5 phòng mới ---
const ROOM_TAB={bep:"bep","phong-anh":"phong_anh","phong-em":"phong_em","goc-sang-tao":"sang_tao",gac:"gac"};
const ROOM_HINT={bep:"Chạm tủ lạnh để đọc lời nhắn, chạm bếp để nấu cho nhau.",phong_anh:"Giường để đi ngủ, bàn làm việc để báo đang bận, tủ đồ để phối đồ.",phong_em:"Giường để đi ngủ, bàn trang điểm để phối đồ, kệ cây trưng những chậu hoa đã nở.",sang_tao:"Giá vẽ mở vẽ tiếp sức, máy đánh chữ mở truyện tiếp sức. Tranh vẽ xong được phơi trên dây.",gac:"Rương kho báu, album hẹn hò, tủ trưng bày, bản đồ, hộp thời gian và từ điển của hai đứa."};
let wardOpen=false,flashObj={};
const cookingAt=()=>{let t=0;[0,1].forEach(i=>{const p=PRES(i);if(p&&p.cookAt)t=Math.max(t,new Date(p.cookAt).getTime());});return t;};
const roomOwner=r=>r==="phong_anh"?ownerOf("anh"):r==="phong_em"?ownerOf("em"):null;
function itemState(r,k){
  const f=flashObj[r+"."+k];if(f&&Date.now()-f.at<900)return f.st;
  const own=roomOwner(r),ck=Date.now()-cookingAt();
  if(k==="bepnau")return ck<90*60e3?"nau":"tat";
  if(k==="banan")return ck<3*3600e3?"baymon":"trong";
  if(k==="giuong")return own!==null&&stOf(own)==="ngu"?"ngu":"gon";
  if(k==="banlamviec")return own!==null&&stOf(own)==="ban"?"sang":"tat";
  if(k==="tudo")return wardOpen&&own===ME?"mo":"dong";
  if(k==="giave"){const d=list("drawings");return d.some(x=>!x.done)?"do":d.some(x=>x.done)?"xong":"trang";}
  if(k==="maydanhchu")return list("story").some(s=>!s.done)?"giay":"khong";
  if(k==="ruong")return myHunt()?"khoa":list("treasures").some(t=>t.found)?"mo":"khoa";
  if(k==="hopthoigian")return list("letters").some(l=>!letterUnlocked(l))?"niemphong":"damo";
  if(k==="tudien")return list("dict").length?"mo":"dong";
  return SC3.rooms[r].items[k].st[0];
}
function roomSceneHTML(r){
  const Rm=SC3.rooms[r],t=buoi(),k=Rm.ppm/SC3.rig.ppm*1.3,own=roomOwner(r);let html="";
  for(const [key,it] of Object.entries(Rm.items)){const st=itemState(r,key),n=key+"_"+st,b=Rm.layers[n];if(!b)continue;
    const z=["dayphoi","kesuutap","bandogioi"].includes(key)?3:b[3];
    html+=`<button type="button" class="lay hot" data-ri="${key}" aria-label="${esc(it.label)}" style="${PX(b[0],b[1],b[2]-b[0],b[3]-b[1],z)}"><img src="${A3(r+"_"+n)}" alt="" draggable="false"></button>`;}
  // kệ cây phòng Em: những chậu đã nở
  if(r==="phong_em"&&Rm.spots.kecay){const pots=careNow().pots,fk=Rm.ppm/SC3.flower.ppm;Rm.spots.kecay.slice(0,Math.min(6,pots)).forEach((p,i)=>{html+=sprite(`hoa_${FL3[i%6]}_gd5`,p,fk*0.9,p[1]+2,"",SC3.flower.anchor,256);});}
  // dây phơi tranh: tranh đã vẽ xong
  if(r==="sang_tao"&&Rm.spots.tranh){const ex=Rm.spots.tranhEx,[o0,oz,oy]=ex,a=(oz[0]-o0[0])/100,b2=(oz[1]-o0[1])/100,c=-(oy[0]-o0[0])/100,d=-(oy[1]-o0[1])/100;
    list("drawings").filter(x=>x.done&&x.top).sort(byDate).slice(-5).forEach((dr,i)=>{const p=Rm.spots.tranh[i];html+=`<div class="onwall tranh" style="transform:matrix(${(a*0.36).toFixed(4)},${(b2*0.36).toFixed(4)},${(c*0.36).toFixed(4)},${(d*0.36).toFixed(4)},${p[0]-a*18},${p[1]})"><img src="${esc(dr.top)}" alt=""><img src="${esc(dr.bottom||"")}" alt=""></div>`;});}
  // người trong phòng
  if(ME!==null){const sp=Rm.spots.dung||[];
    const who=own!==null?[own]:[ME].concat(isHere(OTHER())?[OTHER()]:[]);
    who.forEach((i,j)=>{if(own!==null&&stOf(i)==="ngu")return;const pt=sp[j]||sp[0];if(!pt)return;const here=i===ME||isHere(i);
      html+=`<span class="chr${here?"":" ghost"}" style="z-index:${Math.round(pt[1])}">${charStack(i,i===ME&&Date.now()-waveMe<1600?"vaytay":"dung",pt,k,null)}<span class="ctag c-${CH(i)}" style="left:${pt[0]}px;top:${pt[1]+8}px">${N(i)}${here?"":`<small> · ${stOf(i)==="ban"?"đang bận":"đi vắng"}</small>`}</span></span>`;});}
  return`<div class="room3d t-${t}"><div class="w3fit rstage" data-w="1170"><div class="wcanvas" style="width:1170px;height:1170px">
    <img class="wbg" src="${A3(r+"_"+t)}" alt="${esc(Rm.title)}" draggable="false">${html}</div></div>${r!=="gac"?fx():""}</div>`;
}
function wardrobeHTML(){
  const R=SC3.rig,lk=lookOf(ME),row=(lbl,key,opts)=>`<div class="ward-row"><div class="lbl">${lbl}</div><div class="seg">${Object.entries(opts).filter(([v])=>!(key==="bot"&&v==="chantran"&&false)).map(([v,t])=>`<label><input type="radio" name="wd-${key}" value="${v}" ${lk[key]===v?"checked":""}><span>${t}</span></label>`).join("")}</div></div>`;
  const prev=charStack(ME,"vaytay",[256,470],1,null,"ward-prev",{look:lk,expr:exprOf(ME)});
  return`<section class="blk" id="ward"><div><h2 class="v3h">Phối đồ cho ${N(ME)}</h2><p class="v3sub">Chọn xong là ${N(OTHER())} thấy ngay, ở mọi phòng và trên bản đồ.</p></div>
    <div class="ward"><div class="ward-stage"><div class="ward-canvas">${prev}</div></div>
      <div class="ward-opts">${row("Kiểu tóc","hair",R.hairs)}${row("Màu tóc","hc",R.hairColors)}${row("Áo / váy","top",R.tops)}${row("Quần / giày","bot",R.bots)}${row("Mũ","hat",R.hats)}${row("Phụ kiện","acc",R.accs)}
      <div class="row"><button type="button" class="linkish" data-wreset="1">Về đồ mặc định</button></div></div></div></section>`;
}
function moodHTML(){const cur=(()=>{const p=PRES(ME);return p&&p.mood&&Date.now()-new Date(p.moodAt||0)<16*3600e3?p.mood:"";})();
  return`<section class="blk"><div><h2 class="v3h">Tâm trạng hôm nay</h2><p class="v3sub">Khuôn mặt nhân vật của bạn đổi theo, ${N(OTHER())} nhìn là biết.</p></div>
  <div class="seg">${[["","Mặc định"]].concat(Object.entries(SC3.rig.exprs).filter(([k])=>k!=="ngu")).map(([v,t])=>`<label><input type="radio" name="mood" value="${v}" ${cur===v?"checked":""}><span>${t}</span></label>`).join("")}</div></section>`;}
function renderRooms(){
  for(const [tab,r] of Object.entries(ROOM_TAB)){
    const root=$("tab-"+tab);if(!root||$("v-"+tab).hidden)continue;
    if(!SC3||!SC3.rooms){root.innerHTML=`<p class="quiet">Đang mở phòng...</p>`;continue;}
    const Rm=SC3.rooms[r],own=roomOwner(r),mine=own!==null&&own===ME;
    const title=own!==null?"Phòng "+N(own):Rm.title;
    let extra="";
    if(r==="bep"){const ck=cookingAt(),who=[0,1].find(i=>PRES(i)&&PRES(i).cookAt&&new Date(PRES(i).cookAt).getTime()===ck);
      extra=`<section class="blk"><div><h2 class="v3h">${Date.now()-ck<90*60e3?`${N(who)} đang nấu cho ${N(1-who)}`:"Nấu cho nhau"}</h2><p class="v3sub">Bật bếp là ${N(OTHER())} nhận được một cái chạm “đang nấu một món ngon cho bạn”. Bàn ăn sẽ bày món trong 3 tiếng.</p></div>
        <div class="room-acts"><button type="button" class="btn btn-main btn-small" data-ri="bepnau">Bật bếp nấu</button><a class="btn btn-ghost btn-small" href="#tu-lanh">Mở tủ lạnh nhắn nhủ</a></div></section>`;}
    if(own!==null&&ME!==null){
      if(mine)extra=`<section class="blk" id="myStatus2"><div><h2 class="v3h">Bạn đang làm gì?</h2></div><div class="seg">${[["","Rảnh, ở nhà"],["ban","Đang bận"],["ngu","Đi ngủ rồi"]].map(([v,l])=>`<label><input type="radio" name="mystat2" value="${v}" ${stOf(ME)===v?"checked":""}><span>${l}</span></label>`).join("")}</div></section>${moodHTML()}${wardrobeHTML()}`;
      else extra=`<p class="quiet">${N(own)} ${stOf(own)==="ngu"?"đang ngủ, suỵt...":stOf(own)==="ban"?"đang bận việc":isHere(own)?"đang ở nhà":"đang đi vắng"}.</p>`;}
    if(r==="sang_tao")extra=`<div class="room-acts"><a class="btn btn-main btn-small" href="#ve">Vẽ tiếp sức</a><a class="btn btn-ghost btn-small" href="#truyen">Truyện tiếp sức</a></div>`;
    if(r==="gac")extra=`<div class="room-acts gac-links"><a class="btn btn-ghost btn-small" href="#tu-dien">Từ điển</a><a class="btn btn-ghost btn-small" href="#bao-tang">Bảo tàng</a><a class="btn btn-ghost btn-small" href="#ban-do">Bản đồ</a><a class="btn btn-ghost btn-small" href="#thu">Hộp thời gian</a></div>`;
    root.innerHTML=`<div class="tab-head"><div><a class="back" href="#nha">‹ Bản đồ ngôi nhà</a><h2>${esc(title)}</h2><p>${ROOM_HINT[r]}</p></div></div>${roomSceneHTML(r)}${extra}`;
    fit3();
    root.querySelectorAll("[data-ri]").forEach(b=>b.onclick=()=>roomItem(r,b.dataset.ri));
    root.querySelectorAll('input[name="mystat2"]').forEach(x=>x.onchange=()=>{setMine({st:x.value,stAt:nowIso(),sit:false});toast(x.value==="ngu"?"Chúc ngủ ngon":x.value==="ban"?"Đã báo là bạn đang bận":"Bạn đang rảnh ở nhà");});
    root.querySelectorAll('input[name="mood"]').forEach(x=>x.onchange=()=>{setMine({mood:x.value,moodAt:nowIso()});});
    root.querySelectorAll('.ward-opts input[type=radio]').forEach(x=>x.onchange=()=>{const key=x.name.slice(3),looks=Object.assign({},S.meta.looks||{});looks[ME]=Object.assign({},lookOf(ME),{[key]:x.value});putMeta({looks});schedule();});
    const wr=root.querySelector("[data-wreset]");if(wr)wr.onclick=()=>{const looks=Object.assign({},S.meta.looks||{});delete looks[ME];putMeta({looks});toast("Đã về đồ mặc định");};
  }
}
function roomItem(r,key){
  const it=SC3.rooms[r].items[key],go=it.go,own=roomOwner(r);
  const flash=(st,then)=>{flashObj[r+"."+key]={st,at:Date.now()};schedule();setTimeout(then,650);};
  if(go==="cook"){setMine({cookAt:nowIso()});sendTap("cook");return;}
  if(go==="banan"){toast(Date.now()-cookingAt()<3*3600e3?"Món ngon đã bày, ngồi vào ăn thôi":"Bàn ăn còn trống. Bật bếp nấu cho nhau nhé");return;}
  if(go==="ngu"||go==="ban"){if(own!==ME){toast("Đây là "+(go==="ngu"?"giường":"bàn")+" của "+S.meta.names[own]);return;}const v=stOf(ME)===go?"":go;setMine({st:v,stAt:nowIso(),sit:false});toast(v==="ngu"?"Chúc ngủ ngon":v==="ban"?"Đã báo là bạn đang bận":"Bạn đang rảnh ở nhà");return;}
  if(go==="phoido"){if(own!==ME){toast("Tủ đồ của "+S.meta.names[own]+", chỉ "+S.meta.names[own]+" mới mở được");return;}wardOpen=true;schedule();setTimeout(()=>{const w=$("ward");if(w)w.scrollIntoView({behavior:reduced()?"auto":"smooth"});},120);return;}
  if(go==="kho-bau"){location.hash="nha";setTimeout(()=>{const h=document.querySelector(".hunt,.hidden-note,#tab-home details");if(h)h.scrollIntoView({behavior:reduced()?"auto":"smooth",block:"center"});},400);return;}
  const target=go;const openable=SC3.rooms[r].items[key].st.includes("mo");
  if(openable&&itemState(r,key)!=="mo")flash("mo",()=>{location.hash=target;});else location.hash=target;
}

// --- nối vào app ---
Object.keys(ROOM_TAB).forEach(t=>{NAVG[0].tabs.push(t);TABS.push(t);});Object.assign(TABNAME,{bep:"Bếp","phong-anh":"Phòng Anh","phong-em":"Phòng Em","goc-sang-tao":"Góc sáng tạo",gac:"Gác kỷ niệm"});
const _rv3b=renderV3;renderV3=function(){_rv3b();renderRooms();};
window.addEventListener("hashchange",()=>{wardOpen=false;schedule();});
