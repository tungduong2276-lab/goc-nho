import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync,statSync} from "node:fs";
const scene=JSON.parse(readFileSync("assets/3d/scene.json","utf8"));
test("all 4 lighting variants and every interactive bedroom state are regenerated",()=>{
 for(const room of ["phong_anh","phong_em"]){
  const metadata=scene.rooms[room];
  assert.deepEqual(metadata.size,[1170,1170]);
  for(const time of ["sang","ngay","chieu","dem"])
   assert.ok(statSync("assets/3d/"+room+"_"+time+".webp").size>1000);
  for(const [id,descriptor] of Object.entries(metadata.items))
   for(const state of descriptor.st){
    const key=id+"_"+state;
    assert.ok(statSync("assets/3d/"+room+"_"+key+".webp").size>100);
    const b=metadata.layers[key];
    assert.ok(b&&b.length===4&&b.every(Number.isFinite));
    assert.ok(b[0]>=0&&b[1]>=0&&b[2]<=1170&&b[3]<=1170);
   }
 }
});
test("source-layout bed models remain safe and original character/floor-shelf anchors persist",()=>{
 const brother=scene.rooms.phong_anh;
 const sister=scene.rooms.phong_em;
 assert.equal(brother.spots.dung.length,2);
 assert.equal(sister.spots.dung.length,2);
 assert.equal(sister.spots.kecay.length,6);
 // Geometry and item identities must survive the new export.
 assert.deepEqual(Object.keys(brother.items),["giuong","banlamviec","tudo","kesuutap"]);
 assert.deepEqual(Object.keys(sister.items),["giuong","bantrangdiem","kecay","hopnhatky"]);
 for(const b of [brother.layers.giuong_gon,sister.layers.giuong_gon]){
  assert.ok(b[2]>b[0]+40&&b[3]>b[1]+40);
 }
});
test("unrelated rooms and map remain part of the original scene schema",()=>{
 for(const id of ["bep","sang_tao","gac","khu_vuon","quan_ca_phe","ben_thuyen"]){
  assert.ok(scene.rooms[id]);
  assert.deepEqual(scene.rooms[id].size,[1170,1170]);
 }
 assert.ok(scene.room.layers.pk_sofa);
 assert.ok(scene.map?.zones);
});
