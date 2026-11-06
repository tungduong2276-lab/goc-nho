/**
 * Read-only M1 surface sections. Coordinates are metres in THREE world space.
 * A section of rendered triangles is NOT a floor-contact certification:
 * coplanar faces, open meshes, alternate poses and invisible geometry remain
 * potential sources of incompleteness. No writing or approval API exists.
 */
const EPS=1e-7;
const PRECISION=1e4;
const round=n=>Math.round(n*PRECISION)/PRECISION;
const key=p=>round(p[0])+","+round(p[1]);
function equal2(a,b){return Math.abs(a[0]-b[0])<EPS&&Math.abs(a[1]-b[1])<EPS;}

/** Extract an X/Z segment from a triangle intersected by y=height. */
export function sliceTriangleAtHeight(a,b,c,height){
 const vertices=[a,b,c];
 if(!vertices.every(p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite))||
    !Number.isFinite(height))throw new Error("INVALID_SOURCE_TRIANGLE");
 const d=vertices.map(p=>p[1]-height);
 if(d.every(x=>Math.abs(x)<=EPS))return {segment:null,coplanar:true};
 const points=[];
 for(let i=0;i<3;i++){
  const j=(i+1)%3;
  if(Math.abs(d[i])<=EPS)points.push([vertices[i][0],vertices[i][2]]);
  if((d[i]<-EPS&&d[j]>EPS)||(d[i]>EPS&&d[j]<-EPS)){
   const t=d[i]/(d[i]-d[j]);
   points.push([
    vertices[i][0]+t*(vertices[j][0]-vertices[i][0]),
    vertices[i][2]+t*(vertices[j][2]-vertices[i][2])
   ]);
  }
 }
 const unique=[];
 for(const p of points)if(!unique.some(q=>equal2(p,q)))unique.push(p);
 if(unique.length<2)return {segment:null,coplanar:false};
 // Triangle may touch plane at two vertices and yield the edge itself.
 // Always use the most separated endpoints in a degenerate configuration.
 let best=null,bestD=EPS*EPS;
 for(let i=0;i<unique.length;i++)for(let j=i+1;j<unique.length;j++){
  const dx=unique[i][0]-unique[j][0],dz=unique[i][1]-unique[j][1],dist=dx*dx+dz*dz;
  if(dist>bestD){bestD=dist;best=[unique[i],unique[j]];}
 }
 return {segment:best,coplanar:false};
}

/** Stitch independently cut triangle segments without inventing filled area. */
export function traceSectionSegments(segments,{maxPaths=4096}={}){
 if(!Array.isArray(segments)||!Number.isInteger(maxPaths)||maxPaths<1)
  throw new Error("INVALID_SECTION_SEGMENTS");
 const nodes=new Map(),adj=new Map(),edges=[],seen=new Set();
 function insert(p){
  const rounded=[round(p[0]),round(p[1])],id=key(rounded);
  if(!nodes.has(id)){nodes.set(id,rounded);adj.set(id,[]);}
  return id;
 }
 for(const seg of segments){
  if(!Array.isArray(seg)||seg.length!==2||seg.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)))
   throw new Error("INVALID_SECTION_SEGMENT");
  const a=insert(seg[0]),b=insert(seg[1]);
  if(a===b)continue;
  const canonical=a<b?a+"|"+b:b+"|"+a;
  if(seen.has(canonical))continue;
  seen.add(canonical);
  const i=edges.length;edges.push([a,b]);adj.get(a).push(i);adj.get(b).push(i);
 }
 const visited=new Set(),paths=[];
 const startNodes=[...nodes.keys()].filter(n=>adj.get(n).length!==2);
 let nonManifoldVertices=startNodes.filter(n=>adj.get(n).length>2).length;
 function walk(start){
  let current=start,previous=null;
  const path=[nodes.get(start)];
  let closed=false;
  while(true){
   const choices=adj.get(current).filter(i=>!visited.has(i));
   if(choices.length===0)break;
   const pick=choices[0];
   visited.add(pick);
   const [u,v]=edges[pick],next=u===current?v:u;
   if(next===start){closed=true;break;}
   path.push(nodes.get(next));previous=current;current=next;
   if(path.length>edges.length+1)throw new Error("SECTION_GRAPH_OVERFLOW");
  }
  if(path.length>=2)paths.push({closed,worldXZ:path});
 }
 for(const start of startNodes){
  while(adj.get(start).some(i=>!visited.has(i))){
   if(paths.length>=maxPaths)break;
   walk(start);
  }
  if(paths.length>=maxPaths)break;
 }
 if(paths.length<maxPaths)for(let i=0;i<edges.length;i++){
  if(visited.has(i))continue;
  walk(edges[i][0]);
  if(paths.length>=maxPaths)break;
 }
 return {paths,rawSegmentCount:segments.length,uniqueSegmentCount:edges.length,
  nonManifoldVertices,openPaths:paths.filter(p=>!p.closed).length,
  truncated:visited.size!==edges.length};
}
