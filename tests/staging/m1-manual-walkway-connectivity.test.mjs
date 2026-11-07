import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {makeFloorAnnotation,buildFloorReviewBundle} from "../../src/house-floor-evidence.mjs";
import {auditManualWalkwayConnectivity,MANUAL_CONNECTIVITY_PROTOCOL,
 pointInReviewPolygon,reviewPolygonsMeet} from "../../src/house-floor-walkway-connectivity.mjs";

const original=JSON.parse(readFileSync("assets/3d/scene.json","utf8"));
const scene=structuredClone(original);
scene.room.dung=[[300,500]];
const poly=(x0,y0,x1,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
const add=(role,vertices,roomId="phong-khach",layerId=null)=>
 makeFloorAnnotation({roomId,role,vertices,layerId},scene);
const run=(annotations=[],s=scene)=>
 auditManualWalkwayConnectivity({bundle:buildFloorReviewBundle(annotations),scene:s});
const get=(audit,room="phong-khach")=>audit.rooms.find(r=>r.roomId===room);

test("review helper is boundary-aware, preserves disconnected shapes and does not fill bounding boxes",()=>{
 const left=poly(200,400,500,600),right=poly(500,400,800,600);
 const afar=poly(820,400,900,600);
 assert.equal(reviewPolygonsMeet(left,right),true,"sharing a segment is a potential connection");
 assert.equal(reviewPolygonsMeet(left,afar),false);
 assert.equal(pointInReviewPolygon([300,500],left),true);
 assert.equal(pointInReviewPolygon([500,500],left),true);
 assert.equal(pointInReviewPolygon([600,500],left),false);
 const concave=[[200,200],[800,200],[800,800],[650,800],[650,300],[450,300],[450,800],[200,800]];
 assert.equal(pointInReviewPolygon([550,400],concave),false);
 assert.equal(pointInReviewPolygon([300,400],concave),true);
});
test("six real source scenes must report missing manual doors and corridors, with no authorization",()=>{
 const result=run();
 assert.equal(result.protocol,MANUAL_CONNECTIVITY_PROTOCOL);
 assert.equal(result.status,"UNAPPROVED");
 assert.equal(result.canPersist,false);
 assert.deepEqual(result.approvedDoorways,[]);
 assert.equal(result.avatarClearanceVerified,false);
 assert.equal(result.rooms.length,6);
 for(const room of result.rooms){
  assert.ok(room.sourceStanding.length>0,room.roomId+" missing source standing anchors");
  assert.equal(room.actualDoorGeometryVerified,false);
  assert.equal(room.actualWalkwayVerified,false);
  assert.equal(room.canPersist,false);
  assert.ok(room.warnings.includes("MISSING_REVIEW_POLYGON_ROLES"));
  assert.ok(room.warnings.includes("NO_MODELED_OR_APPROVED_DOOR_GEOMETRY"));
  assert.ok(room.sourceStanding.every(s=>s.verifiedAccessible===false&&s.canPersist===false));
 }
});
test("manual polygon adjacency can connect two walkways to a proposed doorway without certifying a door",()=>{
 const audit=run([
  add("floor",poly(100,100,900,900)),
  add("walkway",poly(210,430,510,570)),
  add("walkway",poly(510,430,810,570)),
  add("doorway",poly(800,450,860,550))
 ]);
 const room=get(audit);
 assert.equal(room.proposedWalkwayRegions,2);
 assert.equal(room.doorwayConnectedWalkwayRegions,2);
 assert.equal(room.sourceStanding[0].insideProposedFloor,true);
 assert.equal(room.sourceStanding[0].onProposedWalkway,true);
 assert.equal(room.sourceStanding[0].connectedToProposedDoorway,true);
 assert.equal(room.actualDoorGeometryVerified,false);
 assert.equal(room.physicalAvatarClearanceVerified,false);
 assert.equal(room.canPersist,false);
 assert.ok(room.warnings.includes("NO_MODELED_OR_APPROVED_DOOR_GEOMETRY"));
});
test("report disconnected corridor, source standing outside, and possible fixed contact crossing",()=>{
 const disconnected=run([
  add("floor",poly(100,100,900,900)),
  add("walkway",poly(200,400,400,600)),
  add("doorway",poly(750,450,850,550))
 ]);
 assert.equal(get(disconnected).sourceStanding[0].connectedToProposedDoorway,false);
 assert.ok(get(disconnected).warnings.includes("SOURCE_STANDING_NOT_CONNECTED_TO_DRAWN_DOORWAY"));
 const overlapping=run([
  add("floor",poly(100,100,900,900)),
  add("walkway",poly(200,400,800,600)),
  add("doorway",poly(750,450,850,550)),
  add("fixed_contact",poly(550,450,620,530),"phong-khach","pk_sofa")
 ]);
 assert.equal(get(overlapping).potentialWalkwayFixedContactTouch,true);
 assert.ok(get(overlapping).warnings.includes("WALKWAY_TOUCHES_ANNOTATED_FIXED_CONTACT"));
 assert.equal(get(overlapping).canPersist,false);
 const outside=structuredClone(scene);outside.room.dung=[[1050,1050]];
 assert.ok(get(run([add("floor",poly(100,100,900,900))],outside)).warnings
  .includes("SOURCE_STANDING_OUTSIDE_PROPOSED_FLOOR"));
});
test("detect contact bridge crossing a concave floor notch despite every contact vertex inside",()=>{
 const concave=[[200,200],[800,200],[800,800],[650,800],[650,300],[450,300],[450,800],[200,800]];
 const bridge=poly(300,350,700,420);
 const audit=run([add("floor",concave),add("fixed_contact",bridge,"phong-khach","pk_sofa")]);
 assert.equal(get(audit).fixedContactsOutsideProposedFloor,true);
 assert.ok(get(audit).warnings.includes("CONTACT_POSSIBLY_OUTSIDE_PROPOSED_FLOOR"));
 assert.equal(get(audit).canPersist,false);
});
test("reject forged manual-approval evidence and untrusted source standing points",()=>{
 const entry=add("floor",poly(100,100,900,900));
 const raw=buildFloorReviewBundle([entry]);
 assert.throws(()=>auditManualWalkwayConnectivity({bundle:{...raw,status:"APPROVED"},scene}),
  e=>e.code==="UNTRUSTED_MANUAL_FLOOR_BUNDLE");
 assert.throws(()=>auditManualWalkwayConnectivity({bundle:{
  ...raw,annotations:[{...entry,canPersist:true}]},scene}),
  e=>e.code==="UNTRUSTED_FLOOR_ANNOTATION");
 const invalid=structuredClone(scene);invalid.room.dung=[[1200,10]];
 assert.throws(()=>run([],invalid),e=>e.code==="UNTRUSTED_SCENE_STANDING_ANCHOR");
});
