import {test} from "node:test";
import {strict as assert} from "node:assert";
import {analyzeAlphaPixels,sourceAlphaBounds,assertDecorZoneApproved} from "../../src/house-alpha-footprint-review.mjs";
const pixels=(w,h,points)=>{const data=new Uint8ClampedArray(w*h*4);
 for(const [x,y,a=255] of points)data[(y*w+x)*4+3]=a;
 return data;};
test("real alpha excludes transparent padding even if the sprite box is huge",()=>{
 const x=analyzeAlphaPixels({data:pixels(10,8,[[2,3],[4,5],[9,0,10]]),width:10,height:8,tileSize:2});
 assert.deepEqual(x.alphaBounds,[2,3,5,6]);
 assert.equal(x.opaquePixels,2);
 assert.equal(x.occupiedTiles.length,2);
 assert.equal(x.floorContactBounds,null);
 assert.equal(x.canPersist,false);
 assert.deepEqual(sourceAlphaBounds(x,[100,200,300,360]),[140,260,200,320]);
});
test("fully transparent assets are not mistaken for a floor contact",()=>{
 const x=analyzeAlphaPixels({data:pixels(4,3,[]),width:4,height:3});
 assert.equal(x.opaquePixels,0);
 assert.equal(x.alphaBounds,null);
 assert.equal(sourceAlphaBounds(x,[0,0,40,30]),null);
});
test("alpha threshold is strict and edge pixels stay inside image",()=>{
 const x=analyzeAlphaPixels({data:pixels(3,3,[[0,0,32],[2,2,33]]),width:3,height:3,threshold:32});
 assert.deepEqual(x.alphaBounds,[2,2,3,3]);
 assert.deepEqual(x.occupiedTiles,[[0,0]]);
});
test("malformed pixel arrays and impossible source geometry fail closed",()=>{
 assert.throws(()=>analyzeAlphaPixels({data:new Uint8ClampedArray(5),width:2,height:2}),e=>e.code==="INVALID_ALPHA_DATA");
 assert.throws(()=>analyzeAlphaPixels({data:pixels(2,2,[]),width:2,height:2,threshold:256}),e=>e.code==="INVALID_ALPHA_DATA");
 const x=analyzeAlphaPixels({data:pixels(1,1,[[0,0]]),width:1,height:1});
 assert.throws(()=>sourceAlphaBounds(x,[0,0,0,30]),e=>e.code==="INVALID_SOURCE_BOUNDS");
});
test("even forged approval cannot allow experimental geometry into persistence",()=>{
 assert.throws(()=>assertDecorZoneApproved({canPersist:true,floorStatus:"VERIFIED",doorStatus:"VERIFIED",contactStatus:"VERIFIED"}),e=>e.code==="DECOR_ZONE_NOT_APPROVED");
});
