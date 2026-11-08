/**
 * Góc Nhỏ V2 M1.B — opt-in architectural gallery, NOT a replacement for the
 * current playable rooms. Enabled ONLY with ?world2=1&archpreview=1.
 *
 * The WebPs and metadata are generated from genuine Three.js model renders.
 * No Firestore imports, writes, migrations, stored client position or telemetry.
 */
const qs=new URLSearchParams(location.search);
if(qs.get("world2")==="1" && qs.get("archpreview")==="1" && window.__GN_WORLD_V2__){
  const IDS=["phong-khach","bep","phong-anh","phong-em","goc-sang-tao","gac"];
  const ALLOWED=new Set(IDS);
  let manifestPromise=null,manifest=null,selected="bep",lighting="ngay";
  let overlay=false,focusBefore=null,pending=false;
  const elem=(name,cls,text)=>{
    const el=document.createElement(name);if(cls)el.className=cls;
    if(text!==undefined)el.textContent=String(text);return el;
  };
  const btn=(text,cls,listener)=>{
    const el=elem("button",cls,text);el.type="button";
    if(listener)el.addEventListener("click",listener);
    return el;
  };
  const dialog=document.createElement("dialog");
  dialog.id="gn2arch-preview";
  dialog.className="gn2arch-dialog";
  dialog.setAttribute("aria-label","Xem thử sáu phòng 3D rộng hơn");
  const shell=elem("div","gn2arch-shell");
  const header=elem("header","gn2arch-heading");
  header.append(elem("h2","","🏡 Nhà rộng hơn · Bản mẫu 3D"));
  const close=btn("✕ Đóng","gn2arch-close",()=>dialog.close());
  close.setAttribute("aria-label","Đóng bản xem thử kiến trúc");
  header.append(close,elem("p","","Chỉ xem hình học phòng rộng và cửa thật. Phòng đang chơi cùng dữ liệu của hai bạn được giữ nguyên."));
  shell.append(header);

  const tabs=elem("nav","gn2arch-room-tabs");
  tabs.setAttribute("aria-label","Chọn phòng kiến trúc mẫu");
  shell.append(tabs);

  const controls=elem("div","gn2arch-controls");
  const day=btn("☀️ Ban ngày","gn2arch-button",()=>{lighting="ngay";update();});
  const night=btn("🌙 Ban đêm","gn2arch-button",()=>{lighting="dem";update();});
  const measure=btn("📐 Hiện kích thước","gn2arch-button",()=>{overlay=!overlay;update();});
  for(const button of [day,night,measure])controls.append(button);
  shell.append(controls);
  const viewport=elem("div","gn2arch-viewport");
  const picture=elem("img","gn2arch-picture");
  picture.setAttribute("draggable","false");
  picture.decoding="async";
  const svgNS="http://www.w3.org/2000/svg";
  const svg=document.createElementNS(svgNS,"svg");
  svg.classList.add("gn2arch-overlay");
  svg.setAttribute("viewBox","0 0 1170 1170");
  svg.setAttribute("preserveAspectRatio","xMidYMid meet");
  svg.setAttribute("aria-hidden","true");
  viewport.append(picture,svg);
  shell.append(viewport);
  const info=elem("div","gn2arch-summary");
  shell.append(info);
  const note=elem("p","gn2arch-disclaimer",
    "BẢN XEM THỬ · Chưa có hitbox/nhân vật 3D mới · Không lưu lên Firebase · Không thay thế phòng hiện tại.");
  shell.append(note);
  dialog.append(shell);
  document.body.append(dialog);

  function polygon(points,className){
    const el=document.createElementNS(svgNS,"polygon");
    el.setAttribute("points",points.map(p=>p.join(",")).join(" "));
    el.setAttribute("class",className);
    svg.append(el);
  }
  function circle(point,kind,label){
    const el=document.createElementNS(svgNS,"circle");
    el.setAttribute("cx",point[0]);el.setAttribute("cy",point[1]);
    el.setAttribute("r",kind==="door"?19:11);
    el.setAttribute("class","gn2arch-marker gn2arch-marker-"+kind);
    svg.append(el);
    if(label){
      const txt=document.createElementNS(svgNS,"text");
      txt.setAttribute("x",point[0]+23);
      txt.setAttribute("y",point[1]-15);
      txt.classList.add("gn2arch-marker-label");
      txt.textContent=label;
      svg.append(txt);
    }
  }
  function drawMeasurements(room){
    svg.replaceChildren();
    if(!overlay||!room)return;
    polygon(room.floorCornersPixels,"gn2arch-outline");
    const d=room.doorway;
    const line=document.createElementNS(svgNS,"line");
    line.classList.add("gn2arch-walkline");
    line.setAttribute("x1",d.outsidePixels[0]);line.setAttribute("y1",d.outsidePixels[1]);
    line.setAttribute("x2",d.insidePixels[0]);line.setAttribute("y2",d.insidePixels[1]);
    svg.append(line);
    circle(d.floorPixels,"door","Cửa 1,5m");
    circle(d.insidePixels,"inside");
    circle(d.outsidePixels,"outside");
    for(const f of room.furniture)circle(f.px,"furniture");
  }
  function update(){
    if(!manifest)return;
    const room=manifest.rooms[selected];
    if(!room){info.textContent="Chưa có bản dựng phòng này.";return;}
    picture.src="./assets/3d/v2arch/"+room.images[lighting];
    picture.alt="Bản dựng Three.js "+room.title+" · "+(lighting==="ngay"?"ban ngày":"ban đêm");
    tabs.replaceChildren();
    for(const id of IDS){
      const value=manifest.rooms[id];
      const button=btn(value.title,"gn2arch-tab",()=>{
        selected=id;update();
      });
      button.dataset.gn2ArchRoom=id;
      button.setAttribute("aria-current",id===selected?"true":"false");
      button.setAttribute("aria-pressed",id===selected?"true":"false");
      tabs.append(button);
    }
    day.setAttribute("aria-pressed",String(lighting==="ngay"));
    night.setAttribute("aria-pressed",String(lighting==="dem"));
    measure.setAttribute("aria-pressed",String(overlay));
    drawMeasurements(room);
    info.replaceChildren();
    info.append(elem("strong","",room.title+" · "+room.areaSqm+" đơn vị²"));
    const increase=(room.areaSqm/room.originalAreaSqm-1)*100;
    info.append(elem("span","", "Sàn cũ: "+room.originalAreaSqm+
      " → sàn mới: "+room.areaSqm+" (+"+increase.toFixed(1).replace(".",",")+
      "%). Cửa thật: "+room.doorway.widthMetres+" × "+room.doorway.heightMetres+" đơn vị."));
    info.append(elem("small","",
      "Tọa độ và đồ vật hiển thị chỉ để kiểm tra kiến trúc; chưa bật di chuyển hoặc chạm đồ trên hình này."));
  }
  async function load(){
    if(!manifestPromise){
      manifestPromise=fetch("./assets/3d/v2arch/preview.json",{cache:"no-cache"})
        .then(async response=>{
          if(!response.ok)throw new Error("Không tải được bản dựng: HTTP "+response.status);
          const obj=await response.json();
          if(obj.schemaVersion!==1||obj.mode!=="render-only"||
             !Array.isArray(obj.canvas)||obj.canvas.join(",")!=="1170,1170")
            throw new Error("Metadata bản dựng không hợp lệ.");
          if(IDS.some(id=>!obj.rooms?.[id]?.images?.ngay||
            !obj.rooms?.[id]?.images?.dem))throw new Error("Thiếu ảnh một phòng.");
          return obj;
        }).catch(err=>{manifestPromise=null;throw err;});
    }
    return manifestPromise;
  }
  async function open(room){
    if(!ALLOWED.has(room))return false;
    focusBefore=document.activeElement;
    const another=document.querySelector("dialog[open]");
    if(another && another!==dialog)another.close();
    selected=room;lighting="ngay";overlay=false;
    if(!dialog.open)dialog.showModal();
    info.textContent="Đang mở bản dựng 3D...";
    try{
      manifest=await load();
      if(dialog.open)update();
    }catch(err){if(dialog.open)info.textContent="Không thể mở bản xem thử: "+err.message;}
    return true;
  }
  dialog.addEventListener("close",()=>{if(focusBefore?.isConnected)focusBefore.focus();});
  dialog.addEventListener("click",event=>{if(event.target===dialog)dialog.close();});
  picture.addEventListener("error",()=>{
    if(dialog.open)info.textContent="Ảnh mẫu này chưa được dựng hoặc tải thất bại. Phòng cũ vẫn hoạt động bình thường.";
  });
  function install(){
    const hash=decodeURIComponent(location.hash.slice(1));
    if(dialog.open&&!ALLOWED.has(hash))dialog.close();
    for(const id of IDS){
      const root=document.getElementById("v-"+id);
      if(!root||root.hidden)continue;
      const scene=root.querySelector(".room3d");
      if(!scene||root.querySelector(".gn2arch-entry"))continue;
      const entry=btn("🏠 Xem thử phòng 3D rộng hơn","gn2arch-entry",()=>open(id));
      entry.dataset.gn2ArchRoom=id;
      entry.title="Mô hình 8×8 hoặc 8×7, tách khỏi phòng đang chơi";
      scene.insertAdjacentElement("afterend",entry);
    }
  }
  function queueInstall(){
    if(pending)return;pending=true;
    requestAnimationFrame(()=>{pending=false;install();});
  }
  const observer=new MutationObserver(records=>{
    if(records.some(record=>record.addedNodes.length||record.removedNodes.length))
      queueInstall();
  });
  observer.observe(document.body,{subtree:true,childList:true});
  window.addEventListener("hashchange",queueInstall);
  window.__GN_WORLD_V2__.architecturePreview={
    enabled:true,mode:"render-only",cloudWrites:false,rooms:IDS.slice()
  };
  queueInstall();
}
