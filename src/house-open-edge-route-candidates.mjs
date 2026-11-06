/**
 * M1 grid-based source-scene navigation *hypotheses*, not actual doors or a
 * certified walkway. The 3D shell has walls on xMin / zMin, open on xMax/zMax.
 * Never use this output to permit furniture placement or shared data writes.
 */
export const OPEN_EDGE_PROTOCOL="M1_SOURCE_OPEN_EDGE_ROUTES_UNAPPROVED";
const finite=n=>typeof n==="number"&&Number.isFinite(n);
function rectOK(r){return Array.isArray(r)&&r.length===4&&r.every(finite)&&r[0]<r[2]&&r[1]<r[3];}
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function validate({shellRect,obstacles,standing,step,clearance}){
 if(!rectOK(shellRect)||!Array.isArray(obstacles)||obstacles.some(o=>!rectOK(o))||
  !Array.isArray(standing)||standing.some(p=>!Array.isArray(p)||p.length!==2||!p.every(finite))||
  !finite(step)||step<0.1||step>0.5||!finite(clearance)||clearance<0.15||clearance>0.6)
  throw new Error("INVALID_ROUTE_REVIEW_INPUT");
 if((shellRect[2]-shellRect[0])*(shellRect[3]-shellRect[1])>300)
  throw new Error("ROUTE_GRID_OVERFLOW");
}
function insideExpandedRect(p,r,radius){
 const x=clamp(p[0],r[0],r[2]),z=clamp(p[1],r[1],r[3]);
 return (p[0]-x)**2+(p[1]-z)**2<radius**2;
}
export function computeSourceRouteCandidates({
 shellRect,obstacles=[],standing=[],step=0.25,clearance=0.3
}){
 validate({shellRect,obstacles,standing,step,clearance});
 const [x0,z0,x1,z1]=shellRect;
 const nx=Math.ceil((x1-x0)/step),nz=Math.ceil((z1-z0)/step);
 if(nx*nz>10000)throw new Error("ROUTE_GRID_OVERFLOW");
 const at=(ix,iz)=>[Math.min(x1-step/2,x0+(ix+0.5)*step),
  Math.min(z1-step/2,z0+(iz+0.5)*step)];
 const key=(ix,iz)=>iz*nx+ix;
 const blocked=new Uint8Array(nx*nz);
 for(let iz=0;iz<nz;iz++)for(let ix=0;ix<nx;ix++){
  const p=at(ix,iz);
  if(obstacles.some(rect=>insideExpandedRect(p,rect,clearance)))blocked[key(ix,iz)]=1;
 }
 const sides=[
  {name:"OPEN_XMAX_SOURCE_EDGE",sourceEnd:[x1,z0,x1,z1]},
  {name:"OPEN_ZMAX_SOURCE_EDGE",sourceEnd:[x0,z1,x1,z1]}
 ];
 const routes=standing.map((spot,index)=>{
  const ix=clamp(Math.round((spot[0]-x0)/step-0.5),0,nx-1);
  const iz=clamp(Math.round((spot[1]-z0)/step-0.5),0,nz-1);
  const start=key(ix,iz);
  if(spot[0]<x0||spot[0]>x1||spot[1]<z0||spot[1]>z1)
   return {standingIndex:index,sourceSpot:spot,status:"SOURCE_SPOT_OUTSIDE_SHELL",paths:[],canPersist:false};
  if(blocked[start])return {standingIndex:index,sourceSpot:spot,status:"SOURCE_SPOT_INTERSECTS_POSSIBLE_OBSTACLE",paths:[],canPersist:false};
  const parent=new Int32Array(nx*nz).fill(-1);
  const distance=new Int32Array(nx*nz).fill(-1);
  const queue=new Int32Array(nx*nz),found=[-1,-1];
  let head=0,tail=0;queue[tail++]=start;distance[start]=0;
  while(head<tail){
   const cur=queue[head++],cx=cur%nx,cz=Math.floor(cur/nx);
   if(cx===nx-1&&found[0]===-1)found[0]=cur;
   if(cz===nz-1&&found[1]===-1)found[1]=cur;
   if(found.every(x=>x>=0))break;
   for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){
    const xx=cx+dx,zz=cz+dz;if(xx<0||xx>=nx||zz<0||zz>=nz)continue;
    const next=key(xx,zz);if(blocked[next]||distance[next]!==-1)continue;
    distance[next]=distance[cur]+1;parent[next]=cur;queue[tail++]=next;
   }
  }
  const paths=found.map((end,k)=>{
   if(end===-1)return {edge:sides[k].name,found:false,worldXZ:[],estimatedGridDistanceMetres:null};
   const reverse=[];for(let p=end;p>=0;p=parent[p])reverse.push(at(p%nx,Math.floor(p/nx)));
   return {edge:sides[k].name,found:true,
    worldXZ:reverse.reverse().map(p=>p.map(x=>Math.round(x*1000)/1000)),
    estimatedGridDistanceMetres:Math.round(distance[end]*step*1000)/1000,
    status:"REVIEW_ONLY_OPEN_SIDE_APPROACH_NOT_A_DOOR"};
  });
  return {standingIndex:index,sourceSpot:spot,status:"UNAPPROVED_ROUTE_HYPOTHESIS",
   paths,canPersist:false};
 });
 const accessible=Array.from(blocked).filter(v=>!v).length;
 return {protocol:OPEN_EDGE_PROTOCOL,
  worldShellRect:shellRect,openEdges:sides,stepMetres:step,clearanceRadiusMetres:clearance,
  grid:{nx,nz,blockedCells:nx*nz-accessible,candidateUnblockedCells:accessible},
  sourceStandingCount:standing.length,routes,
  doorGeometryPresent:false,verifiedDoorways:[],walkwayVerified:false,
  physicalCollisionsVerified:false,canPersist:false,
  status:"SOURCE_OPEN_EDGES_NOT_AUTHENTICATED_DOORWAYS"};
}
