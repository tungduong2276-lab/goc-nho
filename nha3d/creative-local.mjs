// Máy không đăng nhập vẫn thử vẽ/viết được, nhưng PHẢI gắn nhãn không đồng bộ.
// Cùng API với cloud.js để màn sáng tác không có hai bộ logic.
import { key,painter,draft,artId,bookId,validId,title,cleanStrokes,combinePainting,canPublishPainting,cleanLines,canPublishBook,readCreativeDocs } from "./creative.mjs";

export function localCreative(raw=null,onUpdate=()=>{}){
  let docs=readCreativeDocs(Array.isArray(raw)?raw:[]);
  const notify=()=>onUpdate([...docs.entries()].map(([id,data])=>({id,data})));
  const set=(id,data)=>{docs.set(id,data);notify();};
  return {
    get docs(){return docs;},
    startCreative(kind,label,who,id,at=Date.now()){
      if(!["paint","story"].includes(kind)||!validId(id)||!["anh","em"].includes(who)||!title(label))return {ok:false,message:"Tên tác phẩm chưa hợp lệ"};
      const cur=docs.get(key(kind));if(cur?.id)return {ok:true,session:cur.id};
      set(key(kind),{k:"creative-meta",kind,id,title:title(label),by:who,at,lines:kind==="story"?[]:null});
      return {ok:true,session:id};
    },
    savePaint(session,who,strokes,at=Date.now()){
      if(!validId(session)||!["anh","em"].includes(who)||docs.get(key("paint"))?.id!==session)return false;
      set(painter(who),{k:"creative-paint",session,who,strokes:cleanStrokes(strokes,who),at});return true;
    },
    publishPainting(session,at=Date.now()){
      const m=docs.get(key("paint"));if(m?.id!==session)return {ok:false,message:"Bức tranh không còn mở"};
      const a=docs.get(painter("anh")),b=docs.get(painter("em"));
      const A=a?.session===session?a.strokes:[],B=b?.session===session?b.strokes:[];
      if(!canPublishPainting(A,B))return {ok:false,message:"Cần cả hai người cùng vẽ ít nhất một nét"};
      docs.set(artId(session),{k:"creative-art",id:session,title:m.title,strokes:combinePainting(A,B),at});
      docs.delete(key("paint"));notify();
      return {ok:true,message:"Bức tranh chung đã vào bảo tàng 🖼️",id:session};
    },
    saveStoryDraft(session,who,text,at=Date.now()){
      if(!validId(session)||!["anh","em"].includes(who)||docs.get(key("story"))?.id!==session)return false;
      set(draft(who),{k:"creative-draft",session,who,text:String(text||"").slice(0,300),at});return true;
    },
    appendStory(session,who,text,at=Date.now()){
      const m=docs.get(key("story"));if(m?.id!==session)return {ok:false,message:"Truyện không còn mở"};
      if(!["anh","em"].includes(who)||!String(text||"").trim())return {ok:false,message:"Hãy viết một đoạn trước nhé"};
      const lines=cleanLines(m.lines);
      if(lines.length>=80)return {ok:false,message:"Truyện đã đủ dài, hãy xuất bản"};
      lines.push({by:who,text:String(text).trim().slice(0,300),at});
      set(key("story"),{...m,lines});return {ok:true,message:"Đã viết tiếp, giờ tới bạn kia 📖"};
    },
    publishStory(session,at=Date.now()){
      const m=docs.get(key("story"));if(m?.id!==session)return {ok:false,message:"Truyện không còn mở"};
      const lines=cleanLines(m.lines);
      if(!canPublishBook(lines))return {ok:false,message:"Cả hai cần cùng viết ít nhất một đoạn"};
      docs.set(bookId(session),{k:"creative-book",id:session,title:m.title,lines,at});
      docs.delete(key("story"));notify();
      return {ok:true,message:"Truyện đã vào kệ sách phòng ngủ 📚",id:session};
    }
  };
}
