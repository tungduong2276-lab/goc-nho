/* Góc Nhỏ · Living World V2 experimental slice.
 * Opt in with ?world2=1. Never writes to the real goc-nho Firebase project.
 * Production legacy views remain unchanged until M0 gates and release review.
 */
(function () {
  "use strict";
  var params = new URLSearchParams(location.search);
  if (params.get("world2") !== "1") return;
  if (window.__GN_WORLD_V2__) return;
  window.__GN_WORLD_V2__ = { version: "0.1.0", experimental: true };
  document.documentElement.classList.add("gn2-enabled");

  var testNotes = [];
  var demoReplies = Object.create(null);
  var demoHearts = Object.create(null);
  var demoChat = [];
  var chatMessages = [];
  var chatUnsubscribe = null;
  var chatScope = "";
  var lastFocus = null;
  var openNoteId = null;
  var toastEl = null;
  var MAX_NOTES = 28;
  var lastChat = "";

  function staging() {
    return window.FIREBASE_CONFIG &&
      window.FIREBASE_CONFIG.projectId === "goc-nho-staging-2026" &&
      typeof MODE !== "undefined" && MODE === "db" &&
      typeof dbReady !== "undefined" && dbReady &&
      typeof DB !== "undefined" && DB &&
      typeof ME !== "undefined" && ME !== null &&
      typeof firebase !== "undefined";
  }
  function protect() {
    return staging() ? "Staging Firebase riêng · không phải dữ liệu thật" :
      "Chế độ thử cục bộ · các thao tác ở đây KHÔNG gửi cho người kia";
  }
  function button(text, classname, handler) {
    var el = document.createElement("button");
    el.type = "button";
    el.textContent = text;
    if (classname) el.className = classname;
    if (handler) el.addEventListener("click", handler);
    return el;
  }
  function div(classname, text) {
    var el = document.createElement("div");
    if (classname) el.className = classname;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function ownLabel(who) {
    var names = S.meta && S.meta.names;
    return names && names[who] ? String(names[who]) : (who ? "Em" : "Anh");
  }
  function hint(text) {
    if (!toastEl) { toastEl = div("gn2-toast"); document.body.appendChild(toastEl); }
    toastEl.textContent = text;
    toastEl.hidden = false;
    clearTimeout(hint._t);
    hint._t = setTimeout(function () { toastEl.hidden = true; }, 3000);
  }
  function getNotes() {
    var legacy = typeof list === "function" ? list("fridge") : [];
    return legacy.concat(testNotes).sort(function (a,b) {
      return String(b.date || "").localeCompare(String(a.date || ""));
    }).slice(0, MAX_NOTES);
  }
  function noteById(id) { return getNotes().find(function (n) { return n.id === id; }); }
  function activeDialog() { return document.querySelector("dialog.gn2-dialog[open]"); }
  function createDialog(id, label) {
    var el = document.createElement("dialog");
    el.id = id;
    el.className = "gn2-dialog";
    el.setAttribute("aria-label", label);
    var header = div("gn2-dialog-header");
    header.appendChild(div("gn2-dialog-title", label));
    header.appendChild(button("✕ Đóng", "gn2-close", function () { el.close(); }));
    el.appendChild(header);
    var content = div("gn2-dialog-content");
    el.appendChild(content);
    el.addEventListener("close", function () {
      if (lastFocus && lastFocus.isConnected) lastFocus.focus();
      if (id === "gn2-chat" && chatUnsubscribe) {
        chatUnsubscribe(); chatUnsubscribe = null; chatScope = "";
      }
    });
    el.addEventListener("click", function (event) {
      if (event.target === el) el.close();
    });
    document.body.appendChild(el);
    return el;
  }
  var fridge = createDialog("gn2-fridge", "Chiếc tủ lạnh của hai đứa");
  var chat = createDialog("gn2-chat", "Nói chuyện trong Góc Nhỏ");
  function openDialog(el) {
    if (activeDialog() && activeDialog() !== el) activeDialog().close();
    lastFocus = document.activeElement;
    if (!el.open) el.showModal();
  }
  function status(content) {
    content.appendChild(div("gn2-status", protect()));
  }
  function openFridge() {
    renderFridgeObject();
    openDialog(fridge);
  }
  function renderFridgeObject() {
    var content = fridge.querySelector(".gn2-dialog-content");
    content.replaceChildren();
    status(content);
    var shell = div("gn2-fridge-shell");
    shell.appendChild(div("gn2-fridge-top", "♡ Bếp nhà mình"));
    var door = div("gn2-fridge-door");
    door.appendChild(div("gn2-fridge-handle", ""));
    var grid = div("gn2-note-grid");
    getNotes().forEach(function (n, index) {
      var paper = button((n.sticker ? "💗 " : "📄 ") + (n.text || "Lời nhắn nhỏ") , "gn2-note gn2-paper-" + ((n.color || 0)%4), function () {
        openPaper(n.id);
      });
      paper.title = "Mở mẩu giấy của " + ownLabel(n.by);
      paper.setAttribute("aria-label", "Đọc giấy của " + ownLabel(n.by));
      paper.style.setProperty("--tilt", (((index % 5)-2)*3) + "deg");
      grid.appendChild(paper);
    });
    if (!grid.children.length) grid.appendChild(div("gn2-empty", "Chưa có giấy nào. Hãy dán tờ đầu tiên ♡"));
    door.appendChild(grid);
    shell.appendChild(door);
    content.appendChild(shell);
    content.appendChild(button("✎ Dán một mẩu giấy", "gn2-primary", function () { createNoteForm(); }));
    content.appendChild(div("gn2-muted", "Chạm từng tờ giấy trên cửa tủ để đọc và viết ngay lên chính tờ giấy đó."));
  }
  function createNoteForm() {
    var content = fridge.querySelector(".gn2-dialog-content");
    var existing = content.querySelector(".gn2-editor");
    if (existing) existing.remove();
    var form = document.createElement("form");
    form.className = "gn2-editor";
    var label = document.createElement("label");
    label.textContent = "Viết lên giấy nhắn";
    var input = document.createElement("textarea");
    input.maxLength = 160; input.rows = 3; input.required = true;
    input.placeholder = "Có chuyện gì muốn kể cho người ấy không?";
    label.appendChild(input);form.appendChild(label);
    var select = document.createElement("select");
    ["Hồng đào","Xanh bạc hà","Vàng bơ","Tím oải hương"].forEach(function (name, i) {
      var opt=document.createElement("option");opt.value=String(i);opt.textContent=name;select.appendChild(opt);
    });
    select.setAttribute("aria-label","Màu giấy");
    form.appendChild(select);
    var stickerSelect=document.createElement("select");
    stickerSelect.setAttribute("aria-label","Sticker trên giấy");
    var none=document.createElement("option");none.value="";none.textContent="Không gắn sticker";stickerSelect.appendChild(none);
    ["heart","cat","bunny","bear","boba","gn2-otter","gn2-pudding","gn2-spark"].forEach(function(key) {
      if(!STK[key])return;
      var opt=document.createElement("option");opt.value=key;opt.textContent=STK_NAME[key]||key;stickerSelect.appendChild(opt);
    });
    form.appendChild(stickerSelect);
    var submit=button("Dán lên tủ", "gn2-primary");submit.type="submit";form.appendChild(submit);
    form.addEventListener("submit",async function (e) {
      e.preventDefault();
      var text=input.value.trim();if(!text)return;
      submit.disabled=true;submit.textContent="Đang dán...";
      var note={id:"gn2-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8),
        by:ME===null?0:ME,text:text,color:Number(select.value),sticker:stickerSelect.value||null,
        voice:null,date:new Date().toISOString(),hearts:[false,false],replies:[]};
      try {
        if(staging()) await DB.collection("fridge").doc(note.id).set(note);
        else testNotes.unshift(note);
        openNoteId=note.id;renderFridgeObject();openPaper(note.id);
        hint(staging()?"Đã dán giấy trên Firebase staging":"Đã dán giấy thử trên thiết bị này");
      } catch(err) { submit.disabled=false;submit.textContent="Thử dán lại";hint("Chưa lưu được. Giấy vẫn còn ở khung soạn."); }
    });
    content.appendChild(form);input.focus();
  }
  function openPaper(id) {
    var note=noteById(id); if(!note)return;
    openNoteId=id;
    var content=fridge.querySelector(".gn2-dialog-content");
    content.replaceChildren();status(content);
    content.appendChild(button("‹ Trở lại cửa tủ", "gn2-back", renderFridgeObject));
    var paper=div("gn2-paper-detail gn2-paper-"+((note.color||0)%4));
    paper.appendChild(div("gn2-note-author", "📌 " + ownLabel(note.by) + " · " + new Date(note.date).toLocaleDateString("vi-VN")));
    paper.appendChild(div("gn2-note-body", note.text || "Một chiếc sticker dễ thương ♡"));
    if(note.sticker&&STK[note.sticker]){
      var graphic=div("gn2-note-sticker");
      graphic.innerHTML=STK[note.sticker];paper.appendChild(graphic);
    }
    if(note.voice){
      paper.appendChild(button("▶ Nghe lời nhắn giọng nói", "gn2-secondary", function(){
        var audio=new Audio(note.voice);
        audio.play().catch(function(){hint("Không thể phát lời nhắn âm thanh này.");});
      }));
    }
    var replies=(note.replies||[]).concat(demoReplies[note.id]||[]);
    replies.forEach(function (reply) {
      paper.appendChild(div("gn2-reply", ownLabel(reply.by)+": "+reply.text));
    });
    var actions=div("gn2-note-actions");
    var hearts=demoHearts[note.id]||note.hearts||[false,false];
    var heart=button("♥ Thả tim · "+hearts.filter(Boolean).length, "gn2-secondary", function () { toggleHeart(note); });
    if(ME!==null)heart.setAttribute("aria-pressed",String(!!hearts[ME]));
    actions.appendChild(heart);
    paper.appendChild(actions);
    if (ME!==null) {
      var form=document.createElement("form");form.className="gn2-paper-reply";
      var entry=document.createElement("textarea");entry.rows=2;entry.maxLength=200;
      entry.required=true;entry.placeholder="Đáp lời ngay trên mẩu giấy này...";
      var send=button("↗ Trả lời", "gn2-primary");send.type="submit";
      form.appendChild(entry);form.appendChild(send);
      var replyOp=null;
      form.addEventListener("submit",async function (ev) {
        ev.preventDefault();
        var text=entry.value.trim();if(!text)return;
        send.disabled=true;send.textContent="Đang gửi...";
        if(!replyOp||replyOp.text!==text)replyOp={by:ME,text:text,date:new Date().toISOString(),id:"reply-"+Date.now()+"-"+Math.random().toString(36).slice(2,8)};
        var item=replyOp;
        try {
          if(staging() && !testNotes.some(function(n){return n.id===id;})) {
            await DB.collection("fridge").doc(id).update({
              replies:firebase.firestore.FieldValue.arrayUnion(item)
            });
          } else { (demoReplies[id]||(demoReplies[id]=[])).push(item); }
          replyOp=null;entry.value="";openPaper(id);
          hint(staging()?"Đã trả lời trên staging":"Đã ghi lời đáp thử trên máy này");
        } catch(e) {send.disabled=false;send.textContent="Thử gửi lại";hint("Chưa lưu được; lời đáp vẫn ở đây.");}
      });
      paper.appendChild(form);
    } else paper.appendChild(div("gn2-muted","Hãy chọn điện thoại này của ai để trả lời."));
    content.appendChild(paper);
  }
  async function toggleHeart(note) {
    if(ME===null) {hint("Hãy chọn điện thoại này của ai trước.");return;}
    if(staging()) {
      try {
        var ref=DB.collection("fridge").doc(note.id);
        await DB.firestore.runTransaction(async function(tx){
          var snap=await tx.get(ref);
          if(!snap.exists)throw new Error("note not found");
          var arr=(snap.data().hearts||[false,false]).slice();
          arr[ME]=!arr[ME];tx.update(ref,{hearts:arr});
        });
        var h=(demoHearts[note.id]||note.hearts||[false,false]).slice();h[ME]=!h[ME];demoHearts[note.id]=h;openPaper(note.id);hint("Đã thả tim trên staging");
      }catch(e){hint("Chưa thả tim được. Thử lại nhé.");}
    }else {var h=(demoHearts[note.id]||note.hearts||[false,false]).slice();h[ME]=!h[ME];demoHearts[note.id]=h;openPaper(note.id);hint("Thả tim thử ♡ (chưa đồng bộ)");}
  }
  function locationScope() {
    return location.hash.replace("#","") || "nha";
  }
  function canChatHere() {
    var scope=locationScope();
    return ["nha","phong-khach","bep","phong-anh","phong-em",
      "goc-sang-tao","gac","khu-vuon"].includes(scope);
  }
  function mountHud() {
    if (!canChatHere()) return;
    var scope=locationScope(),root=document.getElementById("v-"+scope);
    if (!root || root.hidden) return;
    var scene=root.querySelector(".room3d,.garden3d,.world");
    if(!scene || scene.querySelector(".gn2-chat-toggle"))return;
    var trigger=button("💬 Trò chuyện", "gn2-chat-toggle", openChat);
    scene.appendChild(trigger);
    if(scope==="bep") {
      var open=button("🧲 Mở tủ lạnh", "gn2-fridge-toggle", openFridge);
      scene.appendChild(open);
    }
  }
  function renderChat() {
    var content=chat.querySelector(".gn2-dialog-content");
    content.replaceChildren();
    status(content);
    content.appendChild(div("gn2-muted", "💬 Hai người có thể trò chuyện trong phòng, không cần rời khỏi không gian chung."));
    var messages=div("gn2-chat-messages");
    (staging()?chatMessages.filter(function(m){return m.scope===locationScope();}):demoChat).slice(-40).forEach(function(m){
      var row=div("gn2-chat-message"+(m.who===ME?" mine":""));
      row.appendChild(div("gn2-chat-bubble",m.text));
      row.appendChild(div("gn2-chat-person",ownLabel(m.who)));
      messages.appendChild(row);
    });
    if(!messages.children.length)messages.appendChild(div("gn2-empty","Chào người thương một câu thử nhé ♡"));
    content.appendChild(messages);
    var form=document.createElement("form");form.className="gn2-chat-form";
    var input=document.createElement("input");
    input.maxLength=280;input.placeholder="Nói gì đó với người ấy...";
    input.required=true;input.setAttribute("aria-label","Tin nhắn");
    var send=button("Gửi", "gn2-primary");send.type="submit";
    if(ME===null){input.disabled=true;send.disabled=true;}
    form.appendChild(input);form.appendChild(send);content.appendChild(form);
    var chatOp=null;
    form.addEventListener("submit",async function(e) {
      e.preventDefault();
      var text=input.value.trim();if(!text)return;
      send.disabled=true;send.textContent="Đang gửi...";
      if(!chatOp||chatOp.text!==text)chatOp={text:text,id:"chat-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,9)};
      try{
        if(staging()){
          await DB.collection("worldChat").doc(chatOp.id).set({
            who:ME,authorUid:UID,text:text,
            at:firebase.firestore.FieldValue.serverTimestamp(),
            scope:locationScope()
          });
        }else {
          demoChat.push({who:ME,text:text,at:Date.now()});
          renderChat();
        }
        chatOp=null;lastChat=text;hint(staging()?"Tin nhắn đã gửi qua staging":"Tin nhắn thử chỉ ở trên thiết bị này");
      }catch(err){hint("Chưa gửi được. Bạn có thể thử lại.");send.disabled=false;send.textContent="Thử lại";}
    });
    messages.scrollTop=messages.scrollHeight;
  }
  function subscribeChat() {
    if(!staging())return;
    var scope=locationScope();
    if(chatUnsubscribe&&chatScope===scope)return;
    if(chatUnsubscribe)chatUnsubscribe();
    chatScope=scope;
    chatUnsubscribe=DB.collection("worldChat").orderBy("at","desc").limit(50).onSnapshot(function(snap){
      chatMessages=snap.docs.map(function(d){return d.data();}).reverse();
      if(chat.open)renderChat();
    },function(){hint("Mất kết nối chat staging. Vui lòng kiểm tra mạng.");});
  }
  function openChat() {
    renderChat();openDialog(chat);subscribeChat();
  }
  var formerRoomItem=roomItem;
  roomItem=function(room,key) {
    if(room==="bep"&&key==="tulanh") {openFridge();return;}
    return formerRoomItem.apply(this,arguments);
  };
  var formerRooms=renderRooms;
  renderRooms=function() {var value=formerRooms.apply(this,arguments);mountHud();return value;};
  var formerHome=renderHome;
  renderHome=function() {var value=formerHome.apply(this,arguments);mountHud();return value;};
  var formerGarden=renderGarden;
  renderGarden=function() {var value=formerGarden.apply(this,arguments);mountHud();return value;};
  document.addEventListener("keydown",function(e) {
    if(e.key==="Escape"&&activeDialog())activeDialog().close();
  });
  window.addEventListener("hashchange",function() {requestAnimationFrame(mountHud);});
  mountHud();
})();