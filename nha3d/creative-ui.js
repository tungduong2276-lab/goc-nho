import { ART_COLORS, MAX_STROKES, cleanStrokes, canPublishPainting, canPublishBook, ERASER_WIDTH, drawPainting } from "./creative.mjs";

const freshId=(prefix)=>prefix+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const names={anh:"Anh",em:"Em"};
const text=(tag,content,cls="")=>{const e=document.createElement(tag);e.textContent=content;if(cls)e.className=cls;return e;};
const ordered=strokes=>[...strokes].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));

export function createCreativeUI({getState,work,who,online,connected=online}){
  const el=document.createElement("section");el.id="creative-sheet";el.className="sheet creative-sheet";
  el.setAttribute("aria-label","Xưởng sáng tác của hai đứa");el.setAttribute("role","dialog");el.hidden=true;document.body.append(el);
  let zone="paint",note="",busy=false,paintSession=null,paintWho=null,ownStrokes=[],liveStroke=null,canvas=null;
  let selected=ART_COLORS[0],width=5,erase=false,dragging=false,lastSend=0,sendTimer=null,writeQueue=Promise.resolve();
  let storyTextarea=null,otherDraft=null,linesBox=null,seenStory=null;
  const modes={paint:"🎨 Vẽ cùng nhau",story:"✍️ Viết truyện chung",museum:"🖼️ Bảo tàng tranh",books:"📚 Kệ sách phòng ngủ"};
  const button=(label,handler,disabled=false)=>{
    const b=document.createElement("button");b.type="button";b.textContent=label;b.className="creative-btn";b.disabled=disabled||busy;
    b.onclick=async()=>{if(busy)return;busy=true;try{const result=await handler();if(result?.message)note=result.message;}
      catch(err){console.warn("Sáng tác chưa lưu được",err);note="Chưa lưu được, kiểm tra mạng rồi thử lại nhé.";}
      finally{busy=false;render();}};
    return b;
  };
  const sendPaint=()=>{
    const session=paintSession;if(!session)return;
    clearTimeout(sendTimer);sendTimer=null;lastSend=Date.now();
    const payload=cleanStrokes([...ownStrokes,...(liveStroke?[liveStroke]:[])],who());
    writeQueue=writeQueue.catch(()=>{}).then(()=>work("savePaint",{session,strokes:payload}))
      .catch(e=>{console.warn("Nét vẽ chưa đồng bộ",e);note="Nét vẽ chưa lưu được. Kiểm tra mạng rồi vẽ tiếp nhé.";});
  };
  const schedulePaint=(immediate=false)=>{
    if(!paintSession)return;
    if(immediate||Date.now()-lastSend>900)sendPaint();
    else if(!sendTimer)sendTimer=setTimeout(sendPaint,950-(Date.now()-lastSend));
  };
  function repaint(){
    if(!canvas)return;
    const s=getState(),p=s.painting;
    if(!p||p.id!==paintSession)return;
    const partnerStrokes=p[who()==="anh"?"em":"anh"]||[];
    drawPainting(canvas,ordered([...partnerStrokes,...ownStrokes,...(liveStroke?[liveStroke]:[])]));
    const pub=el.querySelector("#creative-publish");
    if(pub)pub.disabled=!canPublishPainting(who()==="anh"?ownStrokes:p.anh,who()==="em"?ownStrokes:p.em);
    const status=el.querySelector("#creative-partner");
    if(status){const n=partnerStrokes.length;status.textContent=n?"💞 Người kia đã góp "+n+" nét. Cả hai đang thấy chung một bức tranh.":"💗 Đang chờ người kia vào vẽ nét đầu tiên";}
  }
  const makeCanvas=(strokes,isPreview=false)=>{
    const c=document.createElement("canvas");c.width=480;c.height=320;c.className="creative-canvas";c.style.touchAction=isPreview?"auto":"none";
    drawPainting(c,strokes);return c;
  };
  function render(){
    if(el.hidden)return;
    if(dragging){repaint();return;}
    const s=getState(),me=who(),other=me==="anh"?"em":"anh";
    const preserve=storyTextarea&&document.activeElement===storyTextarea?storyTextarea.value:null;
    el.replaceChildren();canvas=null;storyTextarea=null;otherDraft=null;linesBox=null;
    const header=document.createElement("div");header.className="creative-head";
    header.append(text("h2",modes[zone]));
    const close=button("✕",async()=>{el.hidden=true;return {};});close.className="creative-close";close.setAttribute("aria-label","Đóng");
    header.append(close);el.append(header);
    const tabs=document.createElement("div");tabs.className="creative-tabs";
    for(const [id,label]of Object.entries(modes)){
      const b=document.createElement("button");b.type="button";b.textContent=label;b.setAttribute("aria-pressed",String(id===zone));
      b.onclick=()=>{zone=id;note="";render();};tabs.append(b);
    }el.append(tabs);
    const syncText=()=>connected()?(online()?"💞 Đang nối trực tiếp hai người":"⚠️ Mất mạng · nét/nháp chưa gửi sẽ được thử lưu lại khi kết nối"):"📱 Bản chơi trên máy này — cần nối Góc Nhỏ để xem nét vẽ từ điện thoại kia";
    el.append(text("p",syncText(),"creative-sync"));
    if(note)el.append(text("p",note,"creative-note"));
    const panel=document.createElement("div");panel.className="creative-panel";el.append(panel);
    const section=t=>panel.append(text("h3",t));
    const line=t=>panel.append(text("p",t,"creative-hint"));
    if(zone==="paint"){
      const p=s.painting;
      if(!p){
        section("Bắt đầu một bức tranh chung");
        line("Chỉ có một mặt giấy. Hai đứa nhìn thấy những nét đang vẽ, không giấu nửa tranh nữa.");
        const input=document.createElement("input");input.className="creative-input";input.maxLength=64;input.placeholder="Đặt tên tranh: Ngôi nhà trong mơ";input.id="creative-new-art";panel.append(input);
        panel.append(button("💗 Mở giá vẽ chung",()=>work("startPaint",{id:freshId("p"),title:input.value||"Tranh của hai đứa"})));
      }else{
        section(p.title);
        line("Màu từ hai người cùng nằm trên một khung vẽ. Dùng ngón tay hoặc chuột để vẽ.");
        if(p.id!==paintSession||paintWho!==me){
          clearTimeout(sendTimer);paintSession=p.id;paintWho=me;ownStrokes=cleanStrokes(p[me],me);liveStroke=null;
        }
        canvas=makeCanvas(ordered([...p[other],...ownStrokes]));canvas.setAttribute("aria-label","Tranh chung của Anh và Em");panel.append(canvas);
        canvas.addEventListener("pointerdown",e=>{
          if(dragging)return;
          if(ownStrokes.length>=MAX_STROKES){note="Mỗi người đã đủ 80 nét, xuất bản để vẽ bức mới nhé.";render();return;}
          e.preventDefault();canvas.setPointerCapture(e.pointerId);dragging=true;
          const r=canvas.getBoundingClientRect(),pt={x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};
          const latest=getState().painting;
          const at=Math.max(Date.now(),...ownStrokes.map(s=>s.at+1),...(latest?.[other]||[]).map(s=>s.at+1));
          liveStroke={id:freshId("s"),by:me,at,color:selected,width:erase?ERASER_WIDTH:width,erase,points:[pt]};
          repaint();schedulePaint();
        });
        canvas.addEventListener("pointermove",e=>{
          if(!dragging||!liveStroke||!canvas.hasPointerCapture(e.pointerId))return;e.preventDefault();
          const r=canvas.getBoundingClientRect(),pt={x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};
          const old=liveStroke.points.at(-1);
          if(Math.hypot((pt.x-old.x)*480,(pt.y-old.y)*320)>=3&&liveStroke.points.length<90){
            liveStroke.points.push(pt);repaint();schedulePaint();
          }
        });
        const end=e=>{
          if(!dragging||!canvas.hasPointerCapture(e.pointerId))return;dragging=false;if(liveStroke){
            ownStrokes.push(liveStroke);liveStroke=null;schedulePaint(true);repaint();
          }
        };
        canvas.addEventListener("pointerup",end);canvas.addEventListener("pointercancel",end);
        const tools=document.createElement("div");tools.className="creative-tools";
        for(const color of ART_COLORS){
          const b=document.createElement("button");b.type="button";b.className="creative-swatch";
          b.style.backgroundColor=color;b.title="Chọn màu "+color;b.setAttribute("aria-label","Màu "+color);
          b.setAttribute("aria-pressed",String(!erase&&color===selected));
          b.onclick=()=>{selected=color;erase=false;render();};tools.append(b);
        }
        for(const w of [2,5,9]){
          const b=document.createElement("button");b.type="button";b.className="creative-width";b.textContent=w===2?"Nét mảnh":w===5?"Nét vừa":"Nét đậm";
          b.setAttribute("aria-pressed",String(w===width));b.onclick=()=>{width=w;render();};tools.append(b);
        }
        const eraser=document.createElement("button");
        eraser.type="button";eraser.className="creative-width";eraser.textContent="Tẩy";
        eraser.setAttribute("aria-pressed",String(erase));
        eraser.onclick=()=>{erase=!erase;render();};
        tools.append(eraser);panel.append(tools);
        const partnerHint=text("p","💞 Người kia đang thấy những nét được đồng bộ gần như trực tiếp","creative-hint");
        partnerHint.id="creative-partner";panel.append(partnerHint);
        const both=canPublishPainting(me==="anh"?ownStrokes:p.anh,me==="em"?ownStrokes:p.em);
        const publish=button("🖼️ Hoàn thành → đưa vào bảo tàng",async()=>{
          if(dragging)return {message:"Kết thúc nét vẽ trước nhé"};
          clearTimeout(sendTimer);sendPaint();await writeQueue;
          const v=await work("publishPaint",{session:p.id});if(v?.ok){paintSession=null;ownStrokes=[];}return v;
        },!both);publish.id="creative-publish";panel.append(publish);
        line("Cần mỗi người góp ít nhất một nét trước khi xuất bản. Các tranh cũ vẽ nửa trên/dưới vẫn được giữ trong kho lưu trữ.");
      }
    }else if(zone==="story"){
      const p=s.story;
      if(!p){
        section("Tạo câu chuyện hai người cùng viết");
        line("Cả hai có thể gõ bản nháp đồng thời và thấy chữ của nhau. Không phải chờ đúng lượt.");
        const input=document.createElement("input");input.className="creative-input";input.maxLength=64;input.id="creative-new-book";input.placeholder="Tên truyện: Chúng mình và khu rừng bí mật";panel.append(input);
        panel.append(button("📖 Mở cuốn truyện chung",()=>work("startStory",{id:freshId("b"),title:input.value||"Truyện của hai đứa"})));
      }else{
        section(p.title);
        const list=document.createElement("div");list.className="creative-lines";list.id="creative-lines";panel.append(list);
        for(const item of p.lines)list.append(text("p",names[item.by]+": "+item.text));
        if(!p.lines.length)line("Cuốn sách còn trắng, hai đứa cùng viết những dòng đầu tiên nhé!");
        const otherBox=text("p","", "creative-typing");otherBox.id="creative-other";panel.append(otherBox);
        otherBox.textContent=p.drafts[other]?"✍️ "+names[other]+" đang viết: "+p.drafts[other]:"Đang đợi người kia mở bàn viết…";
        const area=document.createElement("textarea");area.className="creative-input creative-writing";area.maxLength=300;area.rows=4;area.placeholder="Viết đoạn tiếp theo… Người kia nhìn thấy bản nháp của bạn.";
        area.id="creative-story-draft";area.value=preserve!==null?preserve:p.drafts[me]||"";panel.append(area);
        storyTextarea=area;otherDraft=otherBox;linesBox=list;seenStory=p.id;
        let timer=null;
        area.addEventListener("input",()=>{
          clearTimeout(timer);const value=area.value;
          timer=setTimeout(()=>work("saveDraft",{session:p.id,text:value}).catch(err=>console.warn("Nháp chưa đồng bộ",err)),650);
        });
        panel.append(button("✍️ Ghi đoạn văn vào truyện",async()=>{
          const value=area.value.trim();if(!value)return {message:"Hãy viết vài dòng trước nhé"};
          const v=await work("appendStory",{session:p.id,text:value});
          if(v?.ok){area.value="";await work("saveDraft",{session:p.id,text:""});}
          return v;
        }));
        const publishBook=button("📚 Kết truyện → cất vào kệ phòng ngủ",()=>work("publishBook",{session:p.id}),!canPublishBook(p.lines));
        publishBook.id="creative-publish-book";panel.append(publishBook);
        line("Chỉ xuất bản khi cả hai đều đã góp ít nhất một đoạn.");
      }
    }else if(zone==="museum"){
      section("Phòng tranh chung · "+s.artworks.length+" tác phẩm");
      if(!s.artworks.length)line("Hai đứa hãy vẽ tại giá trong xưởng. Khi hoàn thành, tranh tự hiện ở đây.");
      for(const art of s.artworks){
        const card=document.createElement("article");card.className="creative-gallery";
        card.append(text("strong","🖼️ "+art.title));
        card.append(makeCanvas(art.strokes,true));panel.append(card);
      }
    }else{
      section("Tủ truyện của hai đứa · "+s.books.length+" cuốn");
      if(!s.books.length)line("Viết truyện ở xưởng rồi bấm Kết truyện để cất lên kệ sách này.");
      for(const book of s.books){
        const card=document.createElement("details");card.className="creative-book";
        card.append(text("summary","📖 "+book.title));
        for(const l of book.lines)card.append(text("p",names[l.by]+": "+l.text));
        panel.append(card);
      }
    }
  }
  function open(next){
    if(!modes[next])return;
    document.querySelectorAll(".sheet:not(.mini)").forEach(s=>s.hidden=true);
    zone=next;note="";el.hidden=false;render();
  }
  function refresh(){
    if(el.hidden)return;
    const status=el.querySelector(".creative-sync");if(status)status.textContent=connected()?(online()?"💞 Đang nối trực tiếp hai người":"⚠️ Mất mạng · nét/nháp chưa gửi sẽ được thử lưu lại khi kết nối"):"📱 Bản chơi trên máy này — cần nối Góc Nhỏ để xem nét vẽ từ điện thoại kia";
    if(zone==="paint"&&canvas&&getState().painting?.id===paintSession){repaint();return;}
    if(zone==="story"&&storyTextarea&&getState().story?.id===seenStory){
      const s=getState().story,other=who()==="anh"?"em":"anh";
      otherDraft.textContent=s.drafts[other]?"✍️ "+names[other]+" đang viết: "+s.drafts[other]:"Đang đợi người kia mở bàn viết…";
      const pub=el.querySelector("#creative-publish-book");if(pub)pub.disabled=!canPublishBook(s.lines);
      if(linesBox&&linesBox.children.length!==s.lines.length){
        linesBox.replaceChildren(...s.lines.map(l=>text("p",names[l.by]+": "+l.text)));
      }
      return;
    }
    render();
  }
  // Trong chế độ đã nối Firebase, giữ nét trên canvas địa phương nếu mất mạng.
  // Khi reconnect, gửi lại phiên tranh/nháp hiện còn mở. Không tự xuất bản.
  window.addEventListener("online",()=>{
    // Cũng thử gửi lại khi bảng đã đóng: bức tranh dở không mất chỉ vì rời xưởng.
    if(zone==="paint"&&paintSession&&ownStrokes.length)schedulePaint(true);
    if(zone==="story"&&seenStory&&storyTextarea){
      work("saveDraft",{session:seenStory,text:storyTextarea.value}).catch(e=>console.warn("Chưa khôi phục được nháp",e));
    }
    refresh();
  });
  window.addEventListener("offline",refresh);
  el.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();el.hidden=true;}});
  return {open,refresh,close:()=>{el.hidden=true;},active:()=>!el.hidden,element:el};
}
