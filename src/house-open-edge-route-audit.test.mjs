import {test} from "node:test";
import {strict as assert} from "node:assert";
import {computeSourceRouteCandidates,OPEN_EDGE_PROTOCOL} from "./house-open-edge-route-candidates.mjs";
import {buildSixRoomSourceRouteAudit,ROUTE_AUDIT_PROTOCOL} from "./house-open-edge-route-audit.mjs";

test("synthetic clear floor proposes routes to both source-open edges without inventing doors",()=>{
 const out=computeSourceRouteCandidates({
  shellRect:[-2,-2,2,2],standing:[[0,0]],obstacles:[],step:0.25,clearance:0.3});
 assert.equal(out.protocol,OPEN_EDGE_PROTOCOL);
 assert.deepEqual(out.openEdges.map(s=>s.name),["OPEN_XMAX_SOURCE_EDGE","OPEN_ZMAX_SOURCE_EDGE"]);
 assert.equal(out.doorGeometryPresent,false);
 assert.equal(out.verifiedDoorways.length,0);
 assert.equal(out.walkwayVerified,false);
 assert.equal(out.canPersist,false);
 assert.deepEqual(out.routes[0].paths.map(p=>p.found),[true,true]);
 for(const p of out.routes[0].paths)assert.equal(p.status,"REVIEW_ONLY_OPEN_SIDE_APPROACH_NOT_A_DOOR");
});
test("conservative obstacles may disconnect paths but must never prove a blocked doorway",()=>{
 const out=computeSourceRouteCandidates({
  shellRect:[-2,-2,2,2],standing:[[0,0]],obstacles:[[-2,0.4,2,0.7],[0.4,-2,0.7,2]],
  step:0.25,clearance:0.3});
 assert.equal(out.routes[0].paths.some(x=>x.found),false);
 assert.equal(out.walkwayVerified,false);
 assert.equal(out.canPersist,false);
});
test("report invalid and overlapping source standing points rather than moving them invisibly",()=>{
 const out=computeSourceRouteCandidates({
  shellRect:[-2,-2,2,2],standing:[[0,0],[8,0]],obstacles:[[-0.3,-0.3,0.3,0.3]]});
 assert.equal(out.routes[0].status,"SOURCE_SPOT_INTERSECTS_POSSIBLE_OBSTACLE");
 assert.equal(out.routes[1].status,"SOURCE_SPOT_OUTSIDE_SHELL");
 assert.throws(()=>computeSourceRouteCandidates({shellRect:[1,1,0,0]}),/INVALID_ROUTE_REVIEW_INPUT/);
 assert.throws(()=>computeSourceRouteCandidates({shellRect:[-2,-2,2,2],obstacles:[[0,0,NaN,1]]}),/INVALID_ROUTE_REVIEW_INPUT/);
});
test("all six actual Three.js source rooms preserve standing metadata and missing door proof",()=>{
 const audit=buildSixRoomSourceRouteAudit();
 assert.equal(audit.protocol,ROUTE_AUDIT_PROTOCOL);
 assert.equal(audit.rooms.length,6);
 assert.equal(audit.doorwayStatus,"NOT_AUTHENTICATED");
 assert.equal(audit.routeStatus,"UNAPPROVED");
 assert.deepEqual(audit.approvedRoutes,[]);
 assert.equal(audit.canPersist,false);
 assert.match(audit.sourceSha256,/^[a-f0-9]{64}$/);
 let standing=0;
 for(const room of audit.rooms){
  assert.equal(room.doorGeometryPresent,false);
  assert.equal(room.walkwayVerified,false);
  assert.equal(room.canPersist,false);
  assert.deepEqual(room.verifiedDoorways,[]);
  assert.ok(room.sourceStanding.length>=2,room.roomId+" missing original standing spots");
  assert.equal(room.routes.length,room.sourceStanding.length);
  assert.ok(room.grid.nx>0&&room.grid.nz>0);
  for(const route of room.routes){
   assert.equal(route.canPersist,false);
   for(const path of route.paths||[]){
    assert.equal(path.found,Boolean(path.worldXZ.length));
    for(const p of path.worldXZ)assert.ok(p.every(Number.isFinite));
   }
  }
  standing+=room.routes.length;
 }
 assert.ok(standing>=12);
});
