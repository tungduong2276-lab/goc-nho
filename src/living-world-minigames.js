/* Góc Nhỏ: two quick, truly playable local two-person minigames.
 * Pass-and-play only while staging multiplayer protocol is being secured.
 * No network and no Firebase writes; opt in with ?world2=1.
 */
(function(){
"use strict";
if(new URLSearchParams(location.search).get("world2")!=="1")return;
var modal=document.createElement("dialog");
modal.className="gn2-dialog gn2-minigame";
modal.id="gn2-mini";
modal.setAttribute("aria-label","Bàn trò chơi hai người");
modal.innerHTML='<div class="gn2-dialog-header"><div class="gn2-dialog-title">🎲 Bàn trò chơi hai người</div><button type="button" class="gn2-close" data-mini-close>✕ Đóng</button></div><div class="gn2-dialog-content" id="gn2-mini-body"></div>';
document.body.appendChild(modal);
modal.querySelector("[data-mini-close]").addEventListener("click",function(){modal.close();});
modal.addEventListener("click",function(e){if(e.target===modal)modal.close();});
var body=modal.querySelector("#gn2-mini-body");
var choices=[
  {topic:"Nếu hai đứa có một ngày trốn khỏi thế giới, mình đi đâu?",opts:["Một hòn đảo","Quán ăn nhỏ","Vườn hoa","Trên mây"]},
  {topic:"Nếu nuôi thêm một bé thú, chọn ai?",opts:["Cún lông xù","Vịt vàng","Rái cá","Mèo mun"]},
  {topic:"Món quà bí mật hợp ngày mưa nhất?",opts:["Ly cacao","Bức thư","Một chiếc ô","Bánh ngọt"]},
  {topic:"Hai đứa mở một tiệm, bán thứ gì?",opts:["Bánh quy","Hoa","Sticker","Trà sữa"]},
  {topic:"Tên phim tình yêu hai đứa sẽ thuộc thể loại?",opts:["Trinh thám","Hài","Phiêu lưu","Viễn tưởng"]},
  {topic:"Nếu có cánh cửa dịch chuyển, điểm đến đầu tiên?",opts:["Biển","Núi","Thành phố tương lai","Rừng cổ tích"]},
  {topic:"Hôm nay nên có siêu năng lực gì?",opts:["Đọc tiếng mèo","Tua thời gian","Đi xuyên mây","Biến đồ ngọt"]},
  {topic:"Nếu đổi nhà trong một ngày, chọn kiểu nào?",opts:["Nhà cây","Lâu đài","Căn hộ trên mây","Nhà cạnh hồ"]},
  {topic:"Khi cả hai là nhân vật game, ai là boss cuối?",opts:["Chú vịt","Máy pha trà sữa","Cục bông","Chiếc gối"]},
  {topic:"Buổi hẹn bất ngờ sẽ bắt đầu bằng?",opts:["Hộp bí mật","Một bản đồ","Bốc thăm","Bức thư"]},
  {topic:"Chọn nhạc nền cho cuộc sống hai đứa?",opts:["Nhạc jazz","Nhạc game","Piano","Nhạc dance"]},
  {topic:"Thú cưng sẽ gọi hai đứa là gì?",opts:["Đại vương","Người nuôi","Đồng bọn","Bếp trưởng"]}
];
var symbols=[
  ["🌸","Hoa"],["🐱","Mèo"],["🍮","Bánh flan"],["🌙","Trăng"],["🍓","Dâu"],
  ["☕","Cà phê"],["🍄","Nấm"],["⭐","Sao"],["🦆","Vịt"],["🎀","Nơ"]
];
var game=null;
function el(tag,klass,txt) {var v=document.createElement(tag);if(klass)v.className=klass;if(txt!==undefined)v.textContent=txt;return v;}
function btn(txt,fn,klass){var b=el("button",klass||"gn2-secondary",txt);b.type="button";b.addEventListener("click",fn);return b;}
function headline(txt){body.appendChild(el("h3","gn2-mini-head",txt));}
function hint(txt){body.appendChild(el("p","gn2-muted",txt));}
function pick(array,n){var a=array.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a.slice(0,n);}
function gameMenu(){
  game=null;body.replaceChildren();
  headline("Chơi cùng — chọn một trò");
  hint("Phiên bản này chơi chuyền máy giữa hai người. Chưa phải chơi online hai thiết bị; không ghi dữ liệu Firebase.");
  var menu=el("div","gn2-mini-menu");
  menu.appendChild(btn("🔐 Hai nửa mật mã · giải đố hợp tác",startCipher,"gn2-primary"));
  menu.appendChild(btn("💞 Trùng sóng · đoán ý người ấy",startSync,"gn2-primary"));
  body.appendChild(menu);
}
function startCipher(){
  var shuffled=pick(symbols,6),answer=pick(shuffled,4);
  game={type:"cipher",symbols:shuffled,answer:answer,typed:[],phase:"clues",attempts:0};
  renderCipher();
}
function renderCipher(){
  body.replaceChildren();
  headline("🔐 Hai nửa mật mã");
  if(game.phase==="clues"){
    hint("Vai A: chỉ bạn được nhìn 4 từ dưới đây. Hãy ghi nhớ, đừng cho người kia xem rồi chuyển máy.");
    var clue=el("div","gn2-code");
    game.answer.forEach(function(x){clue.appendChild(el("span","gn2-code-cell",x[1]));});
    body.appendChild(clue);
    body.appendChild(btn("Đã nhớ — đưa máy cho B",function(){game.phase="keys";renderCipher();},"gn2-primary"));
    return;
  }
  hint("Vai B: nhìn bảng ký hiệu, nghe A đọc các từ khóa theo thứ tự rồi chạm 4 ký hiệu để mở khóa.");
  var grid=el("div","gn2-code");
  game.typed.forEach(function(x){grid.appendChild(el("span","gn2-code-cell",x[0]));});
  for(var i=game.typed.length;i<4;i++)grid.appendChild(el("span","gn2-code-cell","?"));
  body.appendChild(grid);
  var keys=el("div","gn2-mini-keys");
  game.symbols.forEach(function(x){
    keys.appendChild(btn(x[0]+" "+x[1],function(){if(game.typed.length<4){game.typed.push(x);renderCipher();}}));
  });
  body.appendChild(keys);
  var row=el("div","gn2-mini-actions");
  row.appendChild(btn("⌫ Xóa ký hiệu",function(){game.typed.pop();renderCipher();}));
  if(game.typed.length===4)row.appendChild(btn("Thử mở khóa",function(){
    game.attempts++;
    var win=game.typed.every(function(x,i){return x[0]===game.answer[i][0];});
    if(win){game.phase="won";renderCipherWin();}
    else {game.typed=[];renderCipher();body.prepend(el("div","gn2-status","Chưa đúng! Trao đổi lại với A rồi thử tiếp."));}
  },"gn2-primary"));
  body.appendChild(row);
}
function renderCipherWin(){
  body.replaceChildren();headline("🎉 Cửa bí mật đã mở!");
  hint("Hai đứa phối hợp thành công sau "+game.attempts+" lượt thử. Mỗi lần chơi lại sẽ có thứ tự mật mã khác.");
  body.appendChild(btn("↻ Chơi lại màn mới",startCipher,"gn2-primary"));
  body.appendChild(btn("Chọn trò khác",gameMenu));
}
function startSync(){
  var q=pick(choices,1)[0];game={type:"sync",q:q,phase:0,answers:[]};renderSync();
}
function renderSync(){
  body.replaceChildren();headline("💞 Trùng sóng");
  if(game.phase===0||game.phase===1){
    hint("Lượt của người "+(game.phase===0?"A":"B")+". Hãy chọn bí mật, sau đó chuyển máy cho người kia. Không nhìn đáp án trước.");
    body.appendChild(el("h4","gn2-mini-question",game.q.topic));
    var opts=el("div","gn2-mini-options");
    game.q.opts.forEach(function(x,i){opts.appendChild(btn(x,function(){
      game.answers.push(i);game.phase=game.phase+1;
      if(game.phase===1)renderHandoff();
      else renderReveal();
    }));});
    body.appendChild(opts);return;
  }
  renderReveal();
}
function renderHandoff(){
  body.replaceChildren();headline("🔒 Đã khóa câu trả lời của A");
  hint("Đưa máy cho người B rồi nhấn tiếp. Đáp án A sẽ không hiển thị ở bước này.");
  body.appendChild(btn("Đến lượt B",renderSync,"gn2-primary"));
}
function renderReveal(){
  body.replaceChildren();headline(game.answers[0]===game.answers[1]?"✨ Hai đứa trùng sóng!":"🌈 Khác nhau mới thú vị!");
  hint(game.q.topic);
  body.appendChild(el("div","gn2-mini-reveal","A: "+game.q.opts[game.answers[0]]));
  body.appendChild(el("div","gn2-mini-reveal","B: "+game.q.opts[game.answers[1]]));
  hint("Hãy kể một câu vì sao mình chọn đáp án này. Ván sau sẽ đổi câu hỏi.");
  body.appendChild(btn("↻ Chơi vòng khác",startSync,"gn2-primary"));
  body.appendChild(btn("Chọn trò khác",gameMenu));
}
function openGame(){
  if(modal.open)return;gameMenu();modal.showModal();
}
function mount(){
  var v=document.getElementById("v-vuong-quoc");
  if(!v||v.hidden||v.querySelector("[data-gn2-mini]"))return;
  var area=el("section","blk gn2-game-area");
  area.dataset.gn2Mini="1";
  area.appendChild(el("h3","v3h","🎮 Bàn game mới của hai đứa"));
  area.appendChild(el("p","v3sub","Chơi được ngay trên một máy: giải mật mã chung và đoán ý bằng lượt chọn bí mật."));
  area.appendChild(btn("Mở bàn game 2 người",openGame,"gn2-primary"));
  v.appendChild(area);
}
var old=renderKingdom;
renderKingdom=function(){var result=old.apply(this,arguments);mount();return result;};
window.addEventListener("hashchange",function(){requestAnimationFrame(mount);});
mount();
window.__GN_MINI_V2__={games:2,networkWrites:false,mode:"pass-and-play"};
})();