import {test} from "node:test";
import {strict as assert} from "node:assert";
import {buildSectionAudit,SECTION_PROTOCOL,SECTION_Y,SECTION_HEIGHTS,ROOM_IDS} from "./m1-ground-section-proposals.mjs";

const audit=buildSectionAudit();
const all=audit.rooms.flatMap(room=>[...room.itemStates,...room.bakedComponents]);
test("actual six-room source section audit preserves identities and fail-closed status",()=>{
 assert.equal(audit.protocol,SECTION_PROTOCOL);
 assert.equal(audit.yMetres,SECTION_Y);
 assert.match(audit.sourceSha256,/^[a-f0-9]{64}$/);
 assert.match(audit.algorithmSha256,/^[a-f0-9]{64}$/);
 assert.deepEqual(audit.rooms.map(x=>x.roomId),ROOM_IDS);
 assert.equal(audit.approvedFloorPolygons,null);
 assert.equal(audit.canPersist,false);
 assert.equal(audit.contactVerified,false);
 assert.equal(audit.rooms.reduce((n,r)=>n+r.itemStates.length,0),48);
 assert.equal(audit.rooms.reduce((n,r)=>n+r.bakedComponents.length,0),199);
 for(const r of audit.rooms){
  assert.equal(r.floorApproval,"UNAPPROVED");
  assert.equal(r.doorwayStatus,"UNKNOWN");assert.equal(r.walkwayStatus,"UNKNOWN");
  assert.equal(r.canPersist,false);
 }
});
test("world plane sections yield explicit disconnected paths, never filled colliders",()=>{
 let count=0;
 for(const item of all){
  assert.equal(item.sectionStatus,"REQUIRES_PHYSICAL_VISUAL_REVIEW");
  assert.equal(item.contactVerified,false);assert.equal(item.canPersist,false);
  assert.equal(item.sectionYMetres,SECTION_Y);
  assert.equal(item.projectionYMetres,0);
  assert.ok(Number.isInteger(item.trianglesScanned)&&item.trianglesScanned>=0);
  assert.ok(Number.isInteger(item.distinctSegments)&&item.distinctSegments>=0);
  assert.ok(item.contours.length===item.closedContours+item.openContours);
  for(const path of item.contours){
   assert.equal(typeof path.closed,"boolean");
   assert.equal(path.image1170.length,path.worldXZ.length);
   assert.ok(path.worldXZ.length>=2);
   for(const [w,p] of path.worldXZ.map((a,i)=>[a,path.image1170[i]])){
    assert.equal(w.length,2);assert.equal(p.length,2);
    assert.ok(w.every(Number.isFinite)&&p.every(Number.isFinite));
   }
  }
  if(item.distinctSegments>0)count++;
  if(item.limitReached)assert.ok(item.warningFlags.includes("INCOMPLETE_SECTION_LIMIT_REVIEW"));
  if(item.openContours)assert.ok(item.warningFlags.includes("OPEN_SECTION_CONTOURS_REVIEW"));
 }
 assert.ok(count>15,"Expect source 3D floor-height intersections on multiple items");
});
test("wall-hung source elements do not get synthetic floor contact paths",()=>{
 const map=audit.rooms.find(r=>r.roomId==="gac").itemStates.find(x=>x.layerId==="bandogioi_trong");
 const shelf=audit.rooms.find(r=>r.roomId==="phong-anh").itemStates.find(x=>x.layerId==="kesuutap_trong");
 assert.equal(map.contours.length,0);
 assert.equal(shelf.contours.length,0);
 assert.ok(map.warningFlags.includes("NO_SECTION_AT_SELECTED_HEIGHT_REVIEW"));
});
test("different floor materials remain visible as classified background, not safe placement permission",()=>{
 const living=audit.rooms.find(r=>r.roomId==="phong-khach");
 assert.equal(living.stateCoverage,"ALL_SOURCE_ITEM_STATES");
 assert.ok(living.bakedComponents.some(x=>x.id==="rug"&&x.kind==="FLOOR_COVERING_NOT_BLOCKER"));
 const kitchen=audit.rooms.find(r=>r.roomId==="bep");
 assert.ok(kitchen.bakedComponents.some(x=>x.kind==="FLOOR_FINISH_NOT_BLOCKER"));
 assert.ok(all.every(x=>x.canPersist===false));
});

test("all source items and baked backgrounds preserve real section contours at four heights",()=>{
 assert.deepEqual(SECTION_HEIGHTS,[0.04,0.08,0.22,0.45]);
 let changed=0;
 for(const candidate of all){
  assert.equal(candidate.multiHeightApproval,"UNAPPROVED");
  assert.equal(candidate.heightSlices.length,4);
  assert.ok(candidate.heightSlices.every(s=>s.contactVerified===false&&s.canPersist===false));
  assert.deepEqual(candidate.heightSlices[1].contours,candidate.contours);
  const counts=new Set(candidate.heightSlices.map(s=>s.distinctSegments));
  if(counts.size>1)changed++;
  for(const profile of candidate.heightSlices){
   assert.ok(profile.contours.every(path=>path.worldXZ.every(pt=>pt.every(Number.isFinite))));
  }
 }
 assert.ok(changed>10,"different world heights must expose real source differences");
});
test("all living-room sprite variants appear in the source mesh audit",()=>{
 const living=audit.rooms.find(r=>r.roomId==="phong-khach");
 const expected=["pk_sofa","pk_khung_anh","pk_lich","pk_bang_ghim_trong",
  "pk_bang_ghim_giay","pk_radio_tat","pk_radio_phat","pk_hu_day",
  "pk_hu_nua","pk_hu_it","pk_hu_mo","pk_cuaso_mua"];
 assert.deepEqual(living.itemStates.map(x=>x.layerId),expected);
 assert.equal(living.stateCoverage,"ALL_SOURCE_ITEM_STATES");
});
