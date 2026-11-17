import test from "node:test";
import assert from "node:assert/strict";
import { ART_COLORS, cleanStroke, cleanStrokes, combinePainting, canPublishPainting, canPublishBook,
  readCreativeDocs, creativeState, artId, bookId } from "../../nha3d/creative.mjs";
import { localCreative } from "../../nha3d/creative-local.mjs";

const stroke=(by,at)=>({id:"s"+at,by,at,color:ART_COLORS[by==="anh"?0:1],width:5,points:[[.1,.2],[.7,.6]]});
test("hai người vẽ trên cùng toạ độ khung tranh và cùng nhìn được thành quả",()=>{
  const a=stroke("anh",100),b=stroke("em",101);
  const all=combinePainting([a],[b]);
  assert.equal(all.length,2);
  assert.equal(all[0].by,"anh");assert.equal(all[1].by,"em");
  assert.equal(canPublishPainting([a],[b]),true);
  assert.equal(canPublishPainting([a],[]),false);
});
test("nét vẽ không nhận màu lạ, mã xấu, điểm NaN hoặc mảng quá dài",()=>{
  const dirty={id:"../../../evil",by:"anh",at:9,color:"red",width:200,
    points:[[NaN,2],[-1,2],[2,-2],...Array.from({length:300},()=>[.2,.5])]};
  const c=cleanStroke(dirty);
  assert.equal(c.color,ART_COLORS[0]);assert.equal(c.width,5);
  assert.ok(c.points.length<=90);
  assert.ok(c.points.flat().every(v=>v>=0&&v<=1));
  assert.equal(cleanStrokes([dirty], "em").length,0);
});
test("vẽ chung: mỗi bên viết document riêng, xuất bản thành tranh bảo tàng; không sửa drawings cũ",()=>{
  const local=localCreative();
  const oldDrawings={dr1:{id:"dr1",top:"old half",bottom:"old half",done:true}};
  let res=local.startCreative("paint","Mây trên nóc nhà","anh","p123",100);
  assert.equal(res.ok,true);
  assert.equal(local.savePaint("p123","anh",[stroke("anh",101)],102),true);
  assert.equal(local.publishPainting("p123",103).ok,false);
  local.savePaint("p123","em",[stroke("em",104)],104);
  res=local.publishPainting("p123",106);
  assert.equal(res.ok,true);
  const state=creativeState(local.docs);
  assert.equal(state.artworks.length,1);
  assert.equal(state.artworks[0].title,"Mây trên nóc nhà");
  assert.equal(state.artworks[0].strokes.length,2);
  assert.equal(state.painting,null);
  assert.deepEqual(oldDrawings,{dr1:{id:"dr1",top:"old half",bottom:"old half",done:true}});
});
test("truyện không chia lượt bắt buộc: cả hai đọc nháp và kết truyện thành sách trong phòng ngủ",()=>{
  const local=localCreative();
  assert.equal(local.startCreative("story","Chuyến phiêu lưu của Miu","anh","b123",100).ok,true);
  local.saveStoryDraft("b123","anh","Đêm nọ...",101);
  local.saveStoryDraft("b123","em","Miu nghe...",102);
  let st=creativeState(local.docs);
  assert.equal(st.story.drafts.anh,"Đêm nọ...");assert.equal(st.story.drafts.em,"Miu nghe...");
  assert.equal(local.appendStory("b123","anh","Miu nhìn ra cửa.",103).ok,true);
  assert.equal(local.publishStory("b123",104).ok,false);
  assert.equal(local.appendStory("b123","em","Một vì sao rơi.",105).ok,true);
  assert.equal(canPublishBook(creativeState(local.docs).story.lines),true);
  assert.equal(local.publishStory("b123",106).ok,true);
  st=creativeState(local.docs);
  assert.equal(st.story,null);
  assert.equal(st.books.length,1);
  assert.equal(st.books[0].lines.length,2);
});
test("bản ghi hoàn thành giữ nguyên khi gỡ phiên và snapshot đến sai thứ tự",()=>{
  const docs=readCreativeDocs([{id:artId("a1"),data:{k:"creative-art",id:"a1",title:"Bức một",at:1,strokes:[stroke("anh",1)]}},
    {id:bookId("b1"),data:{k:"creative-book",id:"b1",title:"Truyện một",at:2,lines:[{by:"anh",text:"Xin chào",at:1}]}}]);
  assert.equal(creativeState(docs).artworks.length,1);
  assert.equal(creativeState(docs).books.length,1);
  const onlyArt=readCreativeDocs([{id:bookId("b1"),data:null},{id:artId("a1"),data:docs.get(artId("a1"))}]);
  assert.equal(creativeState(onlyArt).books.length,0);
});
