import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";
import {auditSixRoomComposites,auditCompositedRoom,COMPOSITE_REVIEW_PROTOCOL} from "../../src/house-composite-evidence.mjs";
import {ROOM_SOURCES} from "../../src/house-placement-preview.mjs";
const scene=JSON.parse(readFileSync("assets/3d/scene.json","utf8"));
test("inventory exactly six composited rooms and actual scene.json layers without approval",()=>{
 const reports=auditSixRoomComposites(scene);
 assert.deepEqual(Object.keys(reports).sort(),Object.keys(ROOM_SOURCES).sort());
 for(const [id,report] of Object.entries(reports)){
  const src=ROOM_SOURCES[id],s=src===null?scene.room:scene.rooms[src];
  assert.equal(report.protocol,COMPOSITE_REVIEW_PROTOCOL);
  assert.equal(report.layers.length,Object.keys(s.layers).length);
  assert.deepEqual(report.layers.map(x=>x.layerId).sort(),Object.keys(s.layers).sort());
  assert.ok(report.layers.every(x=>x.status==="RENDERED_SPRITE_EXTENT_NOT_COLLIDER"));
  assert.equal(report.obstacles.length,2);
  assert.equal(report.floorPolygon,null);
  assert.equal(report.doorwayPolygons,null);
  assert.equal(report.wallCollisionMesh,null);
  assert.equal(report.canPersist,false);
  assert.equal(report.status,"UNAPPROVED");
  assert.ok(report.obstacles.every(x=>x.approved===false&&x.matchingLayerNotGuaranteed===true));
 }
});
test("each interactive item state maps to an actual sprite-layer key",()=>{
 for(const [id,r] of Object.entries(auditSixRoomComposites(scene))){
  if(id==="phong-khach")continue;
  const src=scene.rooms[ROOM_SOURCES[id]];
  for(const group of r.groups)
   for(const state of group.states)assert.ok(Object.hasOwn(src.layers,group.itemId+"_"+state));
 }
});
test("treat original 390px obstacle silhouettes as estimates, not collision masks",()=>{
 const x=auditCompositedRoom(scene,"bep");
 assert.ok(x.obstacles.some(o=>o.layersIntersectingEstimate.length>0));
 assert.ok(x.obstacles.every(o=>o.layersIntersectingEstimate.every(v=>
   v.overlapPx2>0&&v.overlapFraction>=0&&v.overlapFraction<=1)));
});
test("reject missing state sprites and invalid boxes, without guessing",()=>{
 const broken=structuredClone(scene);
 delete broken.rooms.bep.layers.banan_trong;
 assert.throws(()=>auditCompositedRoom(broken,"bep"),e=>e.code==="MISSING_LAYER_STATE");
 const broken2=structuredClone(scene);
 broken2.rooms.bep.layers.tulanh_dong=[-1,0,120,500];
 assert.throws(()=>auditCompositedRoom(broken2,"bep"),e=>e.code==="INVALID_LAYER_BOUNDS");
 assert.throws(()=>auditCompositedRoom(scene,"wrong"),e=>e.code==="UNKNOWN_ROOM");
});
