/**
 * Góc Nhỏ V2 — local navigation; collision data from the photographed floor
 * and furniture FOOTPRINTS, not the transparent sprite bounding boxes.
 * No Firebase operations. Physical geometry remains visual-review gated.
 */
import {ROOM_FLOORS} from "./living-world-floor-geometry.mjs";

export const ROOM_NAV=Object.freeze(Object.fromEntries(
  Object.entries(ROOM_FLOORS).map(([name,def])=>[
    name,Object.freeze({
      floor:def.floor,exit:def.exit,
      furniture:def.furniture,
      blocked:Object.freeze(Object.values(def.furniture))
    })
  ])
));

export function pointInPolygon(point, polygon) {
  if (!Array.isArray(point) || !polygon || polygon.length < 3) return false;
  const [x,y]=point;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  let inside=false;
  for (let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];
    if ((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
  }
  return inside;
}
// The avatar is not a mathematical point: keep their feet clear of
// furniture bases (shadows and wall fixtures are not obstacles).
export const FOOT_CLEARANCE=12;
function squaredDistanceToSegment(p,a,b) {
  const dx=b[0]-a[0],dy=b[1]-a[1],den=dx*dx+dy*dy;
  const t=den?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den)):0;
  const x=a[0]+t*dx-p[0],y=a[1]+t*dy-p[1];
  return x*x+y*y;
}
function touchesObstacle(point,polygon) {
  if(pointInPolygon(point,polygon))return true;
  for(let i=0;i<polygon.length;i++){
    if(squaredDistanceToSegment(point,polygon[i],polygon[(i+1)%polygon.length])<FOOT_CLEARANCE**2)
      return true;
  }
  return false;
}
export function walkable(room,point) {
  const layout=ROOM_NAV[room];
  return !!layout && pointInPolygon(point,layout.floor) &&
    !layout.blocked.some(poly=>touchesObstacle(point,poly));
}
export function clearSegment(room, a, b) {
  if (!walkable(room,a) || !walkable(room,b)) return false;
  const distance=Math.hypot(b[0]-a[0],b[1]-a[1]);
  const samples=Math.max(1,Math.ceil(distance/12));
  for(let i=1;i<samples;i++) {
    const t=i/samples;
    if(!walkable(room,[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]))return false;
  }
  return true;
}
const STEP=32;
const indexOf=p=>Math.round(p[0]/STEP)+","+Math.round(p[1]/STEP);
const posOf=key=>key.split(",").map(v=>Number(v)*STEP);
function closestReachable(room,point) {
  let best=null,score=Infinity;
  for(let x=1;x<=35;x++)for(let y=1;y<=35;y++) {
    const p=[x*STEP,y*STEP],d=Math.hypot(p[0]-point[0],p[1]-point[1]);
    if(d>=score || d>100)continue;
    if(clearSegment(room,point,p)){best=[x,y];score=d;}
  }
  return best;
}
function diagonalAllowed(room, a, direction) {
  if(!direction[0]||!direction[1])return true;
  const p=[a[0]*STEP,a[1]*STEP];
  return walkable(room,[p[0]+direction[0]*STEP,p[1]]) &&
         walkable(room,[p[0],p[1]+direction[1]*STEP]);
}
export function walkPath(room,start,target) {
  if(!walkable(room,start)||!walkable(room,target))return null;
  if(clearSegment(room,start,target))return [start.slice(),target.slice()];
  const first=closestReachable(room,start),last=closestReachable(room,target);
  if(!first||!last)return null;
  const startKey=first.join(","),goalKey=last.join(",");
  const open=[startKey],front=new Set(open),closed=new Set();
  const cost=new Map([[startKey,0]]),prev=new Map();
  const heuristic=key=>Math.hypot(...posOf(key).map((n,i)=>n-last[i]*STEP));
  const dirs=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
  let iterations=0;
  while(open.length && iterations++<1800) {
    open.sort((a,b)=>(cost.get(a)+heuristic(a))-(cost.get(b)+heuristic(b)));
    const current=open.shift();front.delete(current);
    if(current===goalKey) {
      const rev=[current];
      while(prev.has(rev[rev.length-1]))rev.push(prev.get(rev[rev.length-1]));
      rev.reverse();
      const raw=[start.slice(),...rev.map(posOf),target.slice()];
      const result=[raw[0]];let at=0;
      while(at<raw.length-1){
        let next=raw.length-1;
        while(next>at+1&&!clearSegment(room,raw[at],raw[next]))next--;
        if(!clearSegment(room,raw[at],raw[next]))return null;
        result.push(raw[next]);at=next;
      }
      return result;
    }
    closed.add(current);
    const [cx,cy]=current.split(",").map(Number);
    for(const dir of dirs) {
      const nx=cx+dir[0],ny=cy+dir[1],key=nx+","+ny;
      if(closed.has(key)||!walkable(room,[nx*STEP,ny*STEP])||!diagonalAllowed(room,[cx,cy],dir))continue;
      if(!clearSegment(room,[cx*STEP,cy*STEP],[nx*STEP,ny*STEP]))continue;
      const tentative=cost.get(current)+Math.hypot(dir[0],dir[1])*STEP;
      if(tentative<(cost.get(key)??Infinity)) {
        prev.set(key,current);cost.set(key,tentative);
        if(!front.has(key)){open.push(key);front.add(key);}
      }
    }
  }
  return null;
}
export function walkDistance(points) {
  if(!Array.isArray(points))return 0;
  let distance=0;
  for(let i=1;i<points.length;i++)distance+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);
  return distance;
}
