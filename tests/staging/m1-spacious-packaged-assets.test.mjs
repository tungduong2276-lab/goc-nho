import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync,statSync} from "node:fs";
const scene=JSON.parse(readFileSync("assets/3d/scene.json","utf8"));
test("repacked spacious living sprite metadata follows the relocated coffee-table jar",()=>{
 const box=scene.room.layers.pk_hu_day;
 assert.equal(box.length,4);
 assert.ok(box[0]<500,"jar must move left with table instead of retaining original x=562");
 assert.ok(box[2]<=700);
 for(const state of ["day","nua","it","mo"])
  assert.ok(scene.room.layers["pk_hu_"+state],"all jar states must be aligned");
});
test("repacked kitchen dining seat anchors follow the actual relocated 3D table",()=>{
 const seats=scene.rooms.bep.spots.ghe;
 assert.equal(seats.length,2);
 assert.ok(seats[0][1]>710,"first chair must move from old screen y~681");
 assert.ok(seats[1][1]>780,"second chair must move from old screen y~759");
 assert.ok(seats.every(([x,y])=>x>0&&x<1170&&y>0&&y<1170));
 for(const item of Object.values(scene.rooms.bep.items))
  assert.ok(item.st.every(st=>Object.hasOwn(scene.rooms.bep.layers,
    Object.keys(scene.rooms.bep.items).find(k=>scene.rooms.bep.items[k]===item)+"_"+st)));
});
test("all living/kitchen daylight/weather variants and sprite states have nonempty WebPs",()=>{
 for(const room of ["phong_khach","bep"])
  for(const time of ["sang","ngay","chieu","dem"])
   assert.ok(statSync("assets/3d/"+room+"_"+time+".webp").size>1000);
 for(const k of Object.keys(scene.room.layers))assert.ok(statSync("assets/3d/"+k+".webp").size>100);
 for(const k of Object.keys(scene.rooms.bep.layers))assert.ok(statSync("assets/3d/bep_"+k+".webp").size>100);
});
