/* ================= v8 · thế giới 3D (bản đồ ngôi nhà, phòng khách, thú cưng, vườn 3D) ================= */
let SC3=null;
fetch("assets/3d/scene.json").then(r=>r.json()).then(j=>{SC3=j;schedule();}).catch(()=>{});
const A3=n=>"assets/3d/"+n+".webp";
function buoi(d=new Date()){const h=d.getHours();return h>=5&&h<8?"sang":h>=8&&h<17?"ngay":h>=17&&h<19?"chieu":"dem";}
const BUOI_TXT={sang:"Bình minh",ngay:"Ban ngày",chieu:"Hoàng hôn",dem:"Ban đêm"};
const PRES=i=>i===null?null:(S.presence["p"+i]||null);
const isHere=i=>{const p=PRES(i);return !!p&&Date.now()-new Date(p.last)<180e3;};
const stOf=i=>{const p=PRES(i);if(!p||!p.st)return"";if(Date.now()-new Date(p.stAt||0)>14*3600e3)return"";return p.st;};
const sits=i=>{const p=PRES(i);return !!p&&!!p.sit&&Date.now()-new Date(p.sitAt||0)<3*3600e3&&(i===ME||isHere(i));};
function setMine(patch){if(ME===null)return;const id="p"+ME,cur=S.presence[id]||{};put("presence",Object.assign({},cur,patch,{id,who:ME,last:nowIso()}));}
// giữ trạng thái (bận, ngủ, ngồi sofa) khi cập nhật "đang mở app"
touchPresence=function(){if(ME===null)return;const id="p"+ME,cur=S.presence[id];if(cur&&Date.now()-new Date(cur.last)<110e3)return;put("presence",Object.assign({},cur||{},{id,who:ME,last:nowIso()}));};

/* --- thời tiết thật ở cửa sổ (Open-Meteo, không cần tài khoản) --- */
const CITIES={hn:["Hà Nội",21.03,105.85],hcm:["TP. Hồ Chí Minh",10.78,106.7],dn:["Đà Nẵng",16.05,108.2],hp:["Hải Phòng",20.86,106.68],hue:["Huế",16.46,107.6],ct:["Cần Thơ",10.03,105.78],dl:["Đà Lạt",11.94,108.44],nt:["Nha Trang",12.24,109.19]};
let WX={};try{WX=JSON.parse(localStorage.getItem("gn-wx")||"{}")||{};}catch(e){}
function wxRefresh(){
  const key=S.meta.city,c=CITIES[key];if(!c)return;
  if(WX.city===key&&Date.now()-(WX.at||0)<30*60e3)return;
  WX.at=Date.now();
  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c[1]}&longitude=${c[2]}&current=weather_code&timezone=auto`).then(r=>r.json()).then(j=>{
    const code=j&&j.current?j.current.weather_code:null;
    WX={city:key,code,rain:[51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code),at:Date.now()};
    try{localStorage.setItem("gn-wx",JSON.stringify(WX));}catch(e){}schedule();}).catch(()=>{});
}
const raining=()=>!!(S.meta.city&&WX.city===S.meta.city&&WX.rain);
const snowing=()=>{const d=new Date();return d.getMonth()===11&&d.getDate()>=20&&d.getDate()<=26;};

/* --- bố cục khung: mỗi cảnh vẽ trên toạ độ ảnh @3x rồi thu nhỏ vừa màn hình --- */
function fit3(){document.querySelectorAll(".w3fit").forEach(el=>{const w=+el.dataset.w,k=el.clientWidth/w;if(k>0)el.style.setProperty("--k",k);});}
window.addEventListener("resize",fit3);
const PX=(x,y,w,h,z)=>`left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${w.toFixed(1)}px;${h!=null?`height:${h.toFixed(1)}px;`:""}${z!=null?`z-index:${Math.round(z)};`:""}`;
function quadM(q,bw,bh){const[tl,tr,,bl]=q;return`matrix(${((tr[0]-tl[0])/bw).toFixed(4)},${((tr[1]-tl[1])/bw).toFixed(4)},${((bl[0]-tl[0])/bh).toFixed(4)},${((bl[1]-tl[1])/bh).toFixed(4)},${tl[0]},${tl[1]})`;}
function sprite(file,pt,scale,z,cls="",anchor=SC3.char.anchor,size=512){const s=scale;return`<img class="spr ${cls}" src="${A3(file)}" alt="" draggable="false" style="${PX(pt[0]-anchor[0]*s,pt[1]-anchor[1]*s,size*s,size*s,z)}">`;}
const fx=()=>`${raining()?'<div class="fx-rain" aria-hidden="true"></div>':""}${snowing()?'<div class="fx-snow" aria-hidden="true"></div>':""}`;

/* --- cây hoa 3D: kiểu cây xoay vòng theo số chậu đã nở --- */
const FL3=["anhdao","tulip","camtucau","oaihuong","sen","cuc"];
const FL3N={anhdao:"Anh đào",tulip:"Tulip",camtucau:"Cẩm tú cầu",oaihuong:"Oải hương",sen:"Hoa sen",cuc:"Cúc họa mi"};
function careGd(stage,wilt){if(wilt&&stage>=6)return"heo";return stage<1?"gd1":stage<3?"gd2":stage<6?"gd3":"gd4";}
function careNow(){const cs=careStats(),stage=cs.bothCount%10,pots=Math.floor(cs.bothCount/10),wilt=cs.dry!==null&&cs.dry>=3;return{cs,stage,pots,wilt,type:FL3[pots%6],gd:careGd(stage,wilt)};}

/* --- bản đồ ngôi nhà (màn hình chính) --- */
function placeOnMap(i){
  const M=SC3.map,st=stOf(i),who=CH(i);
  if(st==="ngu")return{pt:M[who],pose:"ngu",st};
  if(st==="ban")return{pt:M[who],pose:"dung",st};
  if(i===ME)return{pt:M.khach,pose:"dung",st};
  if(isHere(i))return{pt:[M.khach[0]+64,M.khach[1]+37],pose:"vaytay",st:"o-nha"};
  return{pt:M[who],pose:"dung",st:"vang"};
}
function worldMapHTML(){
  if(!SC3)return`<div class="world w-loading"><p class="quiet">Đang mở ngôi nhà...</p></div>`;
  const M=SC3.map,t=buoi(),o=OTHER(),k=M.ppm/SC3.char.ppm,fk=M.plotPpm/SC3.flower.ppm;
  const st=parseDay(S.meta.startDate),dayN=st?Math.round((dayStart(new Date())-st)/864e5)+1:null;
  let chars="";
  if(ME!==null)[ME,o].forEach(i=>{const p=placeOnMap(i);chars+=sprite(`nv_${CH(i)}_${p.pose}`,p.pt,k*1.15,p.pt[1],"m-ch"+(p.st==="vang"?" ghost":""));});
  // thú cưng nằm trước bậc cửa
  const pet=S.pet&&S.pet.main;if(pet)chars+=sprite(`thu_meo_${pet.color||"trang"}_${petState()==="ngu"?"nam":"ngoi"}`,M.pet_door,k*1.1,M.pet_door[1]);
  // vườn: luống 1 là cây đang chăm, các luống sau là những chậu đã nở
  const cn=careNow();let fl="";
  M.plots.forEach((p,i)=>{let f=null;if(i===0)f=`hoa_${cn.type}_${cn.gd}`;else if(i<=cn.pots)f=`hoa_${FL3[(i-1)%6]}_gd5`;
    if(f)fl+=sprite(f,p,fk*1.05,p[1],"m-fl",SC3.flower.anchor,256);});
  const Z=M.zones,lbl=["khach","bep","sangtao","anh","em","gac","vuon","hopthu","cafe","dao"];
  const cen=pts=>{let x=0,y=0;pts.forEach(p=>{x+=p[0];y+=p[1];});return[x/pts.length,y/pts.length];};
  const zname=k2=>k2==="anh"?"Phòng "+N(S.meta.chars&&S.meta.chars[0]==="em"?1:0):k2==="em"?"Phòng "+N(S.meta.chars&&S.meta.chars[0]==="em"?0:1):Z[k2].name;
  const pres=ME===null?"":isHere(o)?`<span class="live"></span>${N(o)} cũng đang ở nhà`:stOf(o)==="ngu"?`${N(o)} đi ngủ rồi`:stOf(o)==="ban"?`${N(o)} đang bận`:PRES(o)?`${N(o)} ghé lần cuối ${ago(PRES(o).last)}`:`${N(o)} chưa ghé nhà`;
  return`<div class="world t-${t}" aria-label="Bản đồ ngôi nhà">
    <div class="sky" aria-hidden="true">${[1,2,3].map(i=>`<img class="cloud c${i}" src="${A3("may_"+i)}" alt="">`).join("")}</div>
    <div class="wstage w3fit" data-w="${M.size[0]}"><div class="wcanvas" style="width:${M.size[0]}px;height:${M.size[1]}px">
      <img class="wbg" src="${A3("ban_do_"+t)}" alt="Ngôi nhà Góc Nhỏ của ${N(0)} và ${N(1)}" draggable="false">
      ${fl}${chars}
      <div class="msign" style="left:${M.sign[0]}px;top:${M.sign[1]}px">Góc Nhỏ</div>
      <svg class="zones" viewBox="0 0 ${M.size[0]} ${M.size[1]}" aria-hidden="false">${Object.entries(Z).map(([k2,z])=>`<polygon points="${z.poly.map(p=>p.join(",")).join(" ")}" data-zone="${k2}" tabindex="0" role="link" aria-label="${esc(zname(k2))}"><title>${esc(zname(k2))}</title></polygon>`).join("")}</svg>
      ${lbl.map(k2=>{const c=cen(Z[k2].poly);return`<span class="zlbl" style="left:${c[0]}px;top:${c[1]}px">${esc(zname(k2))}</span>`;}).join("")}
    </div></div>
    ${fx()}
    ${dayN?`<div class="w-day"><b>${dayN}</b><span>ngày bên nhau</span></div>`:""}
    <div class="w-time">${BUOI_TXT[t]}${raining()?" · trời mưa":""}</div>
    ${ME!==null?`<p class="w-pres">${pres}</p>`:""}
  </div>
  <p class="sc-hint">Chạm vào một phòng để vào. Phòng khách là nơi hai đứa và bé mèo hay ở.</p>`;
}
function bindWorld(root){
  fit3();
  root.querySelectorAll("[data-zone]").forEach(z=>{const go=()=>zoneGo(z.dataset.zone);z.addEventListener("click",go);z.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();go();}});});
}
function zoneGo(k){
  const map={khach:"phong-khach",bep:"tu-lanh",sangtao:"truyen",gac:"tu-dien",vuon:"khu-vuon",hopthu:"thu",cafe:"hom-nay",ben:"vuong-quoc",dao:"vuong-quoc"};
  if(map[k]){location.hash=map[k];return;}
  // phòng riêng: của mình thì mở trạng thái, của bạn ấy thì xem bạn ấy đang làm gì
  const owner=(S.meta.chars||["anh","em"])[0]===k?0:1;
  if(owner===ME){location.hash="phong-khach";setTimeout(()=>{const s=$("myStatus");if(s)s.scrollIntoView({behavior:reduced()?"auto":"smooth",block:"center"});},350);}
  else{const s=stOf(owner);toast(s==="ngu"?N(owner)+" đang ngủ trong phòng, suỵt...":s==="ban"?N(owner)+" đang bận trong phòng":isHere(owner)?N(owner)+" đang ở phòng khách kìa":"Phòng của "+N(owner)+" đang trống");}
}

/* --- thú cưng --- */
const PET_TXT={moi:"",vui:"đang vui lắm",ok:"đang chơi một mình",doi:"đói rồi, cho bé ăn đi",ban:"lấm lem rồi, tắm cho bé nhé",buon:"đang nhớ người ở xa",ngu:"đang ngủ say",cho:"đang chờ ở cửa vì có tin nhắn mới"};
const PET_COL={trang:"Trắng",cam:"Cam mướp",xam:"Xám xanh"};
const BUB={
  vui:`<path d="M12 20C5.5 15.5 3 12.3 3 8.9 3 6.3 5 4.5 7.3 4.5c1.8 0 3.3 1 4.7 2.7 1.4-1.7 2.9-2.7 4.7-2.7C19 4.5 21 6.3 21 8.9c0 3.4-2.5 6.6-9 11.1z" fill="#FF6FA5"/>`,
  doi:`<path d="M3.5 11h17a8.5 7 0 01-17 0z" fill="#7CC3F2"/><path d="M3.5 11h17" stroke-width="2"/>`,
  ban:`<circle cx="8" cy="13" r="4" fill="#C99B6D"/><circle cx="14" cy="10" r="4.5" fill="#E8C9A0"/><circle cx="16.5" cy="15" r="3" fill="#C99B6D"/>`,
  buon:`<path d="M12 4c3 4.5 5 7.2 5 9.8a5 5 0 01-10 0C7 11.2 9 8.5 12 4z" fill="#7CC3F2"/>`,
  ngu:`<path d="M6 7h6l-6 7h6M14 4h5l-5 5h5" fill="none" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`,
  cho:`<rect x="3" y="6" width="18" height="12" rx="2" fill="#FFFFFF"/><path d="M3.5 7l8.5 6 8.5-6" fill="none" stroke-width="1.8"/><circle cx="17" cy="15" r="2.2" fill="#FF6FA5" stroke="none"/>`
};
function petState(){
  const p=S.pet&&S.pet.main;if(!p)return"moi";
  const h=new Date().getHours(),now=Date.now(),hrs=k=>p[k]&&p[k].at?(now-new Date(p[k].at))/3600e3:999;
  if(h>=22||h<6)return"ngu";
  if(hrs("fed")>12)return"doi";
  if(hrs("bath")>48)return"ban";
  if(ME!==null&&waiting().fridgeNew)return"cho";
  const o=OTHER(),po=PRES(o);if(o!==null&&po&&now-new Date(po.last)>36*3600e3)return"buon";
  if(Math.min(hrs("fed"),hrs("bath"),hrs("pat"))<3)return"vui";
  return"ok";
}
function petAct(kind){
  const p=Object.assign({},S.pet.main||{});const last=p[kind]&&p[kind].at?(Date.now()-new Date(p[kind].at))/60e3:1e9;
  const cool={fed:120,bath:12*60,pat:1}[kind];
  if(last<cool){toast(kind==="fed"?"Bé vừa ăn no rồi, chút nữa nhé":kind==="bath"?"Bé vừa tắm xong, thơm phức rồi":"Từ từ thôi");return;}
  p[kind]={at:nowIso(),by:ME};put("pet",p);petHop=Date.now();
  toast({fed:"Đã cho "+esc(p.name)+" ăn. Bé no căng bụng rồi",bath:"Tắm xong, "+esc(p.name)+" thơm tho sạch sẽ",pat:esc(p.name)+" dụi đầu vào tay bạn"}[kind]);
  try{navigator.vibrate&&navigator.vibrate(12);}catch(e){}
}
let petHop=0;
function petCardHTML(){
  if(ME===null)return"";
  const p=S.pet&&S.pet.main;
  if(!p)return`<section class="blk" id="petCard"><div><h2 class="v3h">Nuôi chung một bé mèo</h2><p class="v3sub">Bé ở phòng khách, đói thì đòi ăn, lâu không tắm thì lấm lem, ai lâu không về thì bé nhớ.</p></div>
    <form class="formcard" id="petNew"><label class="field">Tên bé<input id="pet-name" maxlength="16" placeholder="Ví dụ: Bánh Bao" required></label>
      <div class="field">Màu lông<div class="seg">${Object.entries(PET_COL).map(([k,v],i)=>`<label><input type="radio" name="petcol" value="${k}" ${i?"":"checked"}><span>${v}</span></label>`).join("")}</div></div>
      <div class="petpick">${Object.keys(PET_COL).map(k=>`<img src="${A3("thu_meo_"+k+"_ngoi")}" alt="Mèo ${PET_COL[k]}">`).join("")}</div>
      <button class="btn btn-main">Đón bé về nhà</button></form></section>`;
  const s=petState(),line=k=>p[k]&&p[k].at?`${N(p[k].by)} · ${ago(p[k].at)}`:"chưa có";
  return`<section class="blk" id="petCard"><div><h2 class="v3h">${esc(p.name)} ${PET_TXT[s]}</h2><p class="v3sub">Mèo ${PET_COL[p.color]||""} của ${N(0)} và ${N(1)}</p></div>
    <div class="petcard"><img class="petimg${Date.now()-petHop<1500?" hop":""}" src="${A3(`thu_meo_${p.color||"trang"}_${s==="ngu"?"nam":s==="vui"?"vui":"ngoi"}`)}" alt="">
      <ul class="petlog"><li><b>Cho ăn</b><span>${line("fed")}</span></li><li><b>Tắm</b><span>${line("bath")}</span></li><li><b>Vuốt ve</b><span>${line("pat")}</span></li></ul></div>
    <div class="row petbtns"><button class="btn btn-main btn-small" data-pet="fed">Cho ăn</button><button class="btn btn-ghost btn-small" data-pet="bath">Tắm</button><button class="btn btn-ghost btn-small" data-pet="pat">Vuốt ve</button></div></section>`;
}

/* --- phòng khách --- */
let radioOn=false,waveMe=0;
function jarState(){if(openDate())return"mo";const n=available([]).length;return n>=18?"day":n>=8?"nua":"it";}
function latestPhoto(){const all=["museum","places","dict"].flatMap(c=>list(c)).filter(x=>x.photos&&x.photos.length);all.sort((a,b)=>(a.date||"")<(b.date||"")?-1:1);const x=all.pop();return x?x.photos[0]:null;}
function roomHTML(){
  if(!SC3)return`<p class="quiet">Đang mở phòng khách...</p>`;
  const R=SC3.room,L=R.layers,t=buoi(),o=OTHER(),k=R.ppm/SC3.char.ppm*1.3;
  const st0=parseDay(S.meta.startDate),dayN=st0?Math.round((dayStart(new Date())-st0)/864e5)+1:null;
  const lay=(n,z,act,label)=>{const b=L[n];const img=`<img src="${A3(n)}" alt="" draggable="false">`;
    return act?`<button type="button" class="lay hot" data-r="${act}" aria-label="${label}" style="${PX(b[0],b[1],b[2]-b[0],b[3]-b[1],z)}">${img}</button>`:`<span class="lay" style="${PX(b[0],b[1],b[2]-b[0],b[3]-b[1],z)}">${img}</span>`;};
  const w=ME!==null?waiting():{},notes=!!(w.fridgeNew||list("taps").some(x=>x.to===ME&&Date.now()-new Date(x.at)<864e5));
  const ph=latestPhoto();
  let html=lay("pk_sofa",R.layers.pk_sofa[3],"sofa","Sofa đôi: ngồi cạnh nhau")+lay("pk_khung_anh",3,"anh","Khung ảnh: mở bảo tàng kỷ niệm")+lay("pk_lich",3,"lich","Lịch đếm ngày")
    +lay(notes?"pk_bang_ghim_giay":"pk_bang_ghim_trong",3,"ghim","Bảng ghim: gửi một cái chạm")+lay(radioOn?"pk_radio_phat":"pk_radio_tat",R.layers.pk_radio_tat[3],"radio","Đài radio: bài hát của hai đứa")
    +lay("pk_hu_"+jarState(),R.layers.pk_hu_day[3],"hu","Hũ hẹn hò: bốc thăm")+(raining()?lay("pk_cuaso_mua",4,null):"");
  // chữ số trên lịch + ảnh trong khung (dán theo mặt tường)
  html+=`<div class="onwall cal" style="transform:${quadM(R.lichQuad,130,100)}"><b>${dayN||"?"}</b><span>${dayN?"ngày":"thêm ngày"}</span></div>`;
  html+=`<div class="onwall photo" style="transform:${quadM(R.anhQuad,140,100)}">${ph?`<img src="${esc(ph)}" alt="">`:`<i>♥</i>`}</div>`;
  if(radioOn)html+=`<div class="notes" style="left:${R.radioTop[0]}px;top:${R.radioTop[1]}px" aria-hidden="true"><i>♪</i><i>♫</i><i>♪</i></div>`;
  // nhân vật
  if(ME!==null){
    const seat=i=>R.ghe[CH(i)==="anh"?0:1];
    const meSit=sits(ME),oSit=sits(o),oHere=isHere(o),oSt=stOf(o);
    const mePose=meSit?"ngoi":Date.now()-waveMe<1600?"vaytay":stOf(ME)==="ngu"?"ngu":"dung";
    const mePt=meSit?seat(ME):R.dung[0];
    html+=`<button type="button" class="chr" data-rme="1" aria-label="${N(ME)}" style="z-index:${Math.round(mePt[1]+(meSit?12:0))}">${sprite(`nv_${CH(ME)}_${mePose}`,mePt,k,null)}<span class="ctag c-${CH(ME)}" style="left:${mePt[0]}px;top:${mePt[1]+8}px">${N(ME)}</span></button>`;
    if(oSt!=="ngu"||oHere){
      const oPt=oSit?seat(o):R.dung[1],oPose=oSit?"ngoi":oHere?"vaytay":"dung";
      html+=`<button type="button" class="chr${oHere?"":" ghost"}" data-rhug="1" aria-label="Ôm ${N(o)}" style="z-index:${Math.round(oPt[1]+(oSit?12:0))}">${sprite(`nv_${CH(o)}_${oPose}`,oPt,k,null)}<span class="ctag c-${CH(o)}" style="left:${oPt[0]}px;top:${oPt[1]+8}px">${N(o)}${oHere?"":`<small> · ${oSt==="ban"?"đang bận":"đi vắng"}</small>`}</span></button>`;
    }
  }
  const pet=S.pet&&S.pet.main;
  if(pet){const s=petState();html+=`<button type="button" class="chr pet${Date.now()-petHop<1500?" hop":""}" data-rpet="1" aria-label="${esc(pet.name)}" style="z-index:${Math.round(R.thu[1])}">${sprite(`thu_meo_${pet.color||"trang"}_${s==="ngu"?"nam":s==="vui"?"vui":"ngoi"}`,R.thu,k*0.95,null)}
    ${BUB[s]?`<span class="bubble" style="left:${R.thu[0]}px;top:${R.thu[1]-150}px"><svg viewBox="0 0 24 24" stroke="#1D2B4F" stroke-width="1.6">${BUB[s]}</svg></span>`:""}</button>`;}
  return`<div class="room3d t-${t}"><div class="w3fit rstage" data-w="${R.size[0]}"><div class="wcanvas" style="width:${R.size[0]}px;height:${R.size[1]}px">
      <img class="wbg" src="${A3("phong_khach_"+t)}" alt="Phòng khách" draggable="false">${html}</div></div>${fx()}</div>`;
}
function renderRoom(){
  const root=$("tab-room");if(!root)return;
  const o=OTHER();
  if(ME===null){root.innerHTML=`<a class="back" href="#nha">‹ Bản đồ</a>`;return;}
  const myS=stOf(ME),sit=sits(ME);
  root.innerHTML=`<div class="tab-head"><div><a class="back" href="#nha">‹ Bản đồ ngôi nhà</a><h2>Phòng khách</h2><p>Chạm vào ${N(o)} để ôm, vào sofa để ngồi cạnh nhau, vào hũ để bốc thăm.</p></div></div>
    ${roomHTML()}
    <div class="room-acts"><button type="button" class="btn ${sit?"btn-ghost":"btn-main"} btn-small" data-r="sofa">${sit?"Đứng dậy":"Ngồi xuống sofa"}</button>
      <button type="button" class="btn btn-ghost btn-small" data-r="hu">Mở hũ hẹn hò</button></div>
    <section class="blk" id="tapBox"><div><h2 class="v3h">Gửi ${N(o)} một cái chạm</h2></div><div class="taps">${Object.entries(TAPS).map(([k2,v])=>`<button type="button" data-tap="${k2}">${ICON.heart}${v[0]}</button>`).join("")}</div></section>
    <section class="blk" id="myStatus"><div><h2 class="v3h">Bạn đang làm gì?</h2><p class="v3sub">${N(o)} sẽ thấy bạn ở đâu trên bản đồ ngôi nhà.</p></div>
      <div class="seg">${[["","Rảnh, ở nhà"],["ban","Đang bận"],["ngu","Đi ngủ rồi"]].map(([v,l])=>`<label><input type="radio" name="mystat" value="${v}" ${myS===v?"checked":""}><span>${l}</span></label>`).join("")}</div></section>
    ${petCardHTML()}`;
  fit3();
  root.querySelectorAll("[data-tap]").forEach(b=>b.onclick=()=>sendTap(b.dataset.tap));
  root.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>roomAct(b.dataset.r));
  root.querySelectorAll('input[name="mystat"]').forEach(r=>r.onchange=()=>{setMine({st:r.value,stAt:nowIso(),sit:r.value?false:sits(ME)});toast(r.value==="ngu"?"Chúc ngủ ngon. "+S.meta.names[o]+" sẽ thấy bạn đang ngủ":r.value==="ban"?"Đã báo là bạn đang bận":"Bạn đang rảnh ở nhà");});
  const me=root.querySelector("[data-rme]");if(me)me.onclick=()=>{waveMe=Date.now();schedule();setTimeout(schedule,1700);};
  const hug=root.querySelector("[data-rhug]");if(hug)hug.onclick=()=>{const b=tapCool;sendTap("hug");if(tapCool!==b)floatHeart(hug);};
  const pt=root.querySelector("[data-rpet]");if(pt)pt.onclick=()=>petAct("pat");
  root.querySelectorAll("[data-pet]").forEach(b=>b.onclick=()=>petAct(b.dataset.pet));
  const pn=$("petNew");if(pn)pn.onsubmit=e=>{e.preventDefault();const name=$("pet-name").value.trim()||"Bánh Bao",c=(pn.querySelector('input[name="petcol"]:checked')||{}).value||"trang";
    put("pet",{id:"main",name,color:c,born:nowIso(),by:ME,fed:{at:nowIso(),by:ME}});toast("Chào mừng "+name+" về nhà!");};
}
function floatHeart(el){const r=el.getBoundingClientRect(),h=document.createElement("span");h.className="flyheart";h.textContent="♥";h.style.left=(r.left+r.width/2)+"px";h.style.top=(r.top+10)+"px";document.body.appendChild(h);setTimeout(()=>h.remove(),1300);}
function roomAct(a){
  if(a==="sofa"){const s=!sits(ME);setMine({sit:s,sitAt:nowIso()});const o=OTHER();toast(s?(sits(o)?"Hai đứa ngồi cạnh nhau rồi":"Đã ngồi xuống sofa, chờ "+S.meta.names[o]+" ngồi cạnh"):"Đã đứng dậy");return;}
  if(a==="hu"){location.hash="hom-nay";return;}
  if(a==="lich"){location.hash="nha";setTimeout(()=>{const d=$("dates");if(d)d.scrollIntoView({behavior:reduced()?"auto":"smooth"});},350);return;}
  if(a==="anh"){location.hash="bao-tang";return;}
  if(a==="ghim"){const t=$("tapBox");if(t)t.scrollIntoView({behavior:reduced()?"auto":"smooth",block:"center"});return;}
  if(a==="radio"){radioOn=!radioOn;schedule();if(radioOn){if(S.meta.song)window.open(S.meta.song,"_blank","noopener");else toast("Thêm link bài hát của hai đứa trong Cài đặt nhé");}return;}
}

/* --- vườn 3D trong tab Khu vườn --- */
function carePlant3D(){const c=careNow();return`<img class="plant3d${c.wilt&&c.gd!=="heo"?" wilt":""}" src="${A3(`hoa_${c.type}_${c.gd}`)}" alt="${FL3N[c.type]}, ${c.stage}/10 ngày">`;}
function sill3D(pots){return Array.from({length:pots},(_,i)=>`<span><img src="${A3(`hoa_${FL3[i%6]}_gd5`)}" alt="${FL3N[FL3[i%6]]}"></span>`).join("");}

/* --- biểu tượng điều hướng theo brief: viền xanh than, đang chọn tô màu của mình --- */
const NAV_IC={
  nha:`<path class="w" d="M5 11.5h14V20a1 1 0 01-1 1H6a1 1 0 01-1-1z"/><path class="a" d="M2.8 12L12 4l9.2 8z"/><rect class="p" x="15.4" y="4.6" width="2.8" height="4.4" rx=".6"/><rect class="p" x="10" y="15" width="4" height="6" rx="1"/>`,
  hen:`<rect class="a" x="7" y="2.8" width="10" height="3.4" rx="1.2"/><path class="w" d="M7.4 6.2h9.2a2.6 2.6 0 012.6 2.6V18a3 3 0 01-3 3H7.8a3 3 0 01-3-3V8.8a2.6 2.6 0 012.6-2.6z"/><rect class="p" x="8" y="13.5" width="4.4" height="2.4" rx=".6" transform="rotate(-14 10 14.7)"/><rect class="g" x="12" y="15.6" width="4.4" height="2.4" rx=".6" transform="rotate(10 14 16.8)"/><rect class="y" x="9.6" y="10" width="4.4" height="2.4" rx=".6" transform="rotate(6 11.8 11.2)"/>`,
  vuon:`<path class="g" d="M12 13C11.4 8.6 8.6 6.4 4.6 6.6c.2 4 2.8 6.4 7.4 6.4z"/><path class="g" d="M12 12.6c.6-4.2 3.4-6.4 7.4-6.2-.2 4-2.8 6.2-7.4 6.2z"/><path d="M12 13v2.5" stroke-width="1.6"/><path class="a" d="M6 14.8h12l-1.5 6.2H7.5z"/>`,
  gui:`<rect class="a" x="2.6" y="5.6" width="18.8" height="13.4" rx="2.4"/><path d="M3.4 7l8.6 6.2L20.6 7" fill="none" stroke-width="1.6"/><path class="p" d="M17.6 17.4c-1.9-1.3-2.6-2.1-2.6-3 0-.7.5-1.2 1.2-1.2.6 0 1 .3 1.4.8.4-.5.8-.8 1.4-.8.7 0 1.2.5 1.2 1.2 0 .9-.7 1.7-2.6 3z"/>`,
  choi:`<path class="a" d="M6.5 8h11a4 4 0 013.9 4.8l-.8 4a2.4 2.4 0 01-4.2 1l-1.6-2h-5.6l-1.6 2a2.4 2.4 0 01-4.2-1l-.8-4A4 4 0 016.5 8z"/><path d="M7.5 11v3.2M5.9 12.6h3.2" stroke-width="1.6"/><circle class="p" cx="16.6" cy="11.6" r="1.1"/><circle class="g" cx="18.4" cy="13.6" r="1.1"/><path class="y" d="M17 2.6l3 3-4.6 4.6-3-3z"/>`,
  ky:`<path class="a" d="M4.6 4.2h12.6a2.2 2.2 0 012.2 2.2V21H7a2.4 2.4 0 01-2.4-2.4z"/><path class="w" d="M4.6 18.6A2.4 2.4 0 017 16.2h12.4V21H7a2.4 2.4 0 01-2.4-2.4z"/><path class="y" d="M12 6.6l1.2 2.5 2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4z"/>`
};
function navIcons(){document.querySelectorAll("nav.tabs a[data-group]").forEach(a=>{const s=a.querySelector(".nic svg");if(s&&NAV_IC[a.dataset.group]&&!s.dataset.v8){s.innerHTML=NAV_IC[a.dataset.group];s.dataset.v8=1;}});document.body.dataset.me=ME===null?"":CH(ME);}

/* --- nối vào app --- */
NAVG[0].tabs.push("phong-khach");TABS.push("phong-khach");TABNAME["phong-khach"]="Phòng khách";
const _rv3=renderV3;renderV3=function(){_rv3();renderRoom();navIcons();wxRefresh();};
const _fillS=fillSettings;fillSettings=function(){_fillS();const so=$("set-song");if(so)so.value=S.meta.song||"";const ci=$("set-city");if(ci)ci.value=S.meta.city||"";};
$("saveSettings").addEventListener("click",()=>{const so=$("set-song"),ci=$("set-city");const patch={song:so?so.value.trim():"",city:ci?ci.value:""};if(patch.song&&!/^https?:\/\//i.test(patch.song))patch.song="https://"+patch.song;if(patch.song!==(S.meta.song||"")||patch.city!==(S.meta.city||""))putMeta(patch);},true);
setInterval(()=>{if(!document.hidden)schedule();},5*60e3); // đổi buổi trong ngày
