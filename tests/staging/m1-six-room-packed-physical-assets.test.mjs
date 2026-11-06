import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync,existsSync} from "node:fs";
const root="assets/3d/";
const data=JSON.parse(readFileSync(root+"scene.json","utf8"));
const rooms=[
 ["phong-khach","phong_khach",[7,7]],
 ["bep","bep",[7,7]],
 ["phong-anh","phong_anh",[7,7]],
 ["phong-em","phong_em",[7,7]],
 ["goc-sang-tao","sang_tao",[7,7]],
 ["gac","gac",[7,5]]
];
test("six physically expanded source scenes are fully packed with still-safe 1170px output",()=>{
 assert.equal(data.room.ppm,96);
 assert.ok(Object.keys(data.rooms).length>=5);
 let layerTotal=0;
 for(const [id,source,dimensions] of rooms){
  const scene=id==="phong-khach"?data.room:data.rooms[source];
  assert.deepEqual(scene.sourceWorldFloorMetres,dimensions);
  assert.equal(scene.ppm,96);
  assert.deepEqual(scene.size,[1170,1170]);
  assert.equal(scene.floorCollisionVerified,false);
  assert.equal(scene.doorwayWalkwayVerified,false);
  for(const light of ["sang","ngay","chieu","dem"])
   assert.ok(existsSync(root+source+"_"+light+".webp"),source+" missing "+light);
  for(const [name,box] of Object.entries(scene.layers)){
   const prefix=id==="phong-khach"?"":source+"_";
   assert.ok(existsSync(root+prefix+name+".webp"),"missing "+name);
   assert.equal(box.length,4);
   assert.ok(box.every(Number.isInteger)&&box[0]>=0&&box[1]>=0&&
      box[2]<=1170&&box[3]<=1170&&box[2]>box[0]&&box[3]>box[1]);
   layerTotal++;
  }
  if(id!=="phong-khach"){
   const states=new Set(Object.entries(scene.items).flatMap(([obj,v])=>
    v.st.map(st=>obj+"_"+st)));
   assert.deepEqual(new Set(Object.keys(scene.layers)),states);
  }
 }
 assert.equal(layerTotal,48);
});
