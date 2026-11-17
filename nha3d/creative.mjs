// Sáng tác chung mới: không sử dụng `drawings` nửa trên/dưới và `story` luân phiên cũ.
// Toàn bộ document mới nằm ở couples/{cid}/world/cc_* để giữ nguyên kỷ vật cũ.
export const ART_COLORS=Object.freeze(["#1D2B4F","#ED78A3","#62B8A3","#6FB8EE","#F2AF66","#AB8FE6"]);
export const MAX_STROKES=80,MAX_POINTS=90,MAX_LINES=80;
const WHO=new Set(["anh","em"]);
export const key=(kind)=>"cc_"+kind+"_meta";
export const painter=who=>"cc_paint_"+who;
export const draft=who=>"cc_draft_"+who;
export const artId=id=>"cc_art_"+id;
export const bookId=id=>"cc_book_"+id;
export const validId=id=>typeof id==="string"&&/^[a-zA-Z0-9_-]{1,48}$/.test(id);
const bounded=(s,n)=>typeof s==="string"?s.trim().slice(0,n):"";
const n=v=>Number.isFinite(v)?Math.round(Math.min(1,Math.max(0,v))*1000)/1000:0;
export const title=s=>bounded(s,64);
export function cleanStroke(raw){
  if(!raw||!Array.isArray(raw.points)||raw.points.length<1||!WHO.has(raw.by))return null;
  const color=ART_COLORS.includes(raw.color)?raw.color:ART_COLORS[0];
  const width=[2,5,9].includes(raw.width)?raw.width:5;
  const points=raw.points.slice(0,MAX_POINTS).filter(p=>Array.isArray(p)&&p.length===2&&Number.isFinite(p[0])&&Number.isFinite(p[1]))
    .map(p=>[n(p[0]),n(p[1])]);
  if(!points.length)return null;
  return {id:validId(raw.id)?raw.id:"s"+Math.max(0,Math.floor(raw.at||0)).toString(36),by:raw.by,
    at:Number.isFinite(raw.at)?raw.at:0,color,width,points};
}
export function cleanStrokes(raw,who=null){
  if(!Array.isArray(raw))return [];
  const result=raw.slice(-MAX_STROKES).map(cleanStroke).filter(Boolean);
  return who?result.filter(s=>s.by===who):result;
}
export function combinePainting(anh,em){
  const a=cleanStrokes(anh,"anh"),b=cleanStrokes(em,"em");
  return [...a,...b].sort((x,y)=>x.at-y.at||x.id.localeCompare(y.id)).slice(-MAX_STROKES*2);
}
export function cleanLines(raw){
  if(!Array.isArray(raw))return [];
  return raw.slice(0,MAX_LINES).filter(x=>x&&WHO.has(x.by)&&typeof x.text==="string"&&x.text.trim())
    .map(x=>({by:x.by,text:bounded(x.text,300),at:Number.isFinite(x.at)?x.at:0}));
}
export function canPublishPainting(anh,em){
  return cleanStrokes(anh,"anh").length>0 && cleanStrokes(em,"em").length>0;
}
export function canPublishBook(lines){
  const clean=cleanLines(lines);
  return clean.length>=2&&new Set(clean.map(x=>x.by)).size===2;
}
export function readCreativeDocs(docs){
  const map=new Map();
  for(const item of docs||[]){
    if(!item||typeof item.id!=="string"||!item.id.startsWith("cc_"))continue;
    if(item.data===null)map.delete(item.id);
    else if(item.data&&typeof item.data==="object")map.set(item.id,item.data);
  }
  return map;
}
export function creativeState(map){
  const meta=map.get(key("paint"))||null,story=map.get(key("story"))||null;
  const getPaint=who=>{const raw=map.get(painter(who));return raw&&raw.session===meta?.id?cleanStrokes(raw.strokes,who):[]};
  const getDraft=who=>{const raw=map.get(draft(who));return raw&&raw.session===story?.id?bounded(raw.text,300):""};
  const artworks=[...map.entries()].filter(([id,d])=>id.startsWith("cc_art_")&&d?.k==="creative-art")
    .map(([id,d])=>({id,title:title(d.title)||"Tranh chung",at:d.at||0,strokes:cleanStrokes(d.strokes)})).sort((a,b)=>b.at-a.at).slice(0,24);
  const books=[...map.entries()].filter(([id,d])=>id.startsWith("cc_book_")&&d?.k==="creative-book")
    .map(([id,d])=>({id,title:title(d.title)||"Truyện hai đứa",at:d.at||0,lines:cleanLines(d.lines)})).sort((a,b)=>b.at-a.at).slice(0,24);
  return {painting:meta&&validId(meta.id)?{id:meta.id,title:title(meta.title)||"Bức tranh của hai đứa",anh:getPaint("anh"),em:getPaint("em")}:null,
    story:story&&validId(story.id)?{id:story.id,title:title(story.title)||"Truyện hai đứa",lines:cleanLines(story.lines),drafts:{anh:getDraft("anh"),em:getDraft("em")}}:null,
    artworks,books};
}
