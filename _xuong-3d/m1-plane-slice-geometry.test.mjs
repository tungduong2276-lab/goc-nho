import {test} from "node:test";
import {strict as assert} from "node:assert";
import {sliceTriangleAtHeight,traceSectionSegments} from "./m1-plane-slice-geometry.mjs";

test("plane intersects an actual 3D triangle with two world-XZ endpoints",()=>{
 const out=sliceTriangleAtHeight([0,-1,0],[2,1,0],[0,1,2],0);
 assert.equal(out.coplanar,false);
 assert.ok(out.segment);
 assert.equal(out.segment.length,2);
 assert.deepEqual(out.segment[0],[1,0]);
 assert.deepEqual(out.segment[1],[0,1]);
});
test("tangent and coplanar triangles do not invent filled floor obstacles",()=>{
 assert.deepEqual(sliceTriangleAtHeight([0,0,0],[1,0,0],[0,0,1],0),{segment:null,coplanar:true});
 assert.deepEqual(sliceTriangleAtHeight([0,0,0],[1,1,0],[0,1,1],0),{segment:null,coplanar:false});
 const onEdge=sliceTriangleAtHeight([0,0,0],[2,0,0],[0,1,1],0);
 assert.deepEqual(onEdge.segment,[[0,0],[2,0]]);
 assert.throws(()=>sliceTriangleAtHeight([0,NaN,0],[1,0,0],[2,0,0],0),/INVALID_SOURCE_TRIANGLE/);
});
test("stitch an actual closed square section without enclosing its full AABB by fiat",()=>{
 const lines=[
  [[0,0],[2,0]],[[2,0],[2,2]],[[2,2],[0,2]],[[0,2],[0,0]],
 ];
 const out=traceSectionSegments(lines);
 assert.equal(out.uniqueSegmentCount,4);
 assert.equal(out.openPaths,0);
 assert.equal(out.nonManifoldVertices,0);
 assert.equal(out.truncated,false);
 assert.equal(out.paths.length,1);
 assert.equal(out.paths[0].closed,true);
 assert.equal(out.paths[0].worldXZ.length,4);
});
test("retain disconnected contacts, dedupe triangle-edge repeats and flag open contours",()=>{
 const square=[[[0,0],[1,0]],[[1,0],[1,1]],[[1,1],[0,1]],[[0,1],[0,0]]];
 const translated=square.map(line=>line.map(([x,z])=>[x+4,z+4]));
 const out=traceSectionSegments([...square,...translated,[[1,1],[1,0]]]);
 assert.equal(out.paths.length,2);
 assert.equal(out.paths.filter(p=>p.closed).length,2);
 assert.equal(out.uniqueSegmentCount,8);
 assert.equal(out.truncated,false);
 const open=traceSectionSegments([[[0,0],[2,0]],[[2,0],[3,1]]]);
 assert.equal(open.openPaths,1);
 const branched=traceSectionSegments([[[0,0],[2,0]],[[2,0],[3,1]],[[2,0],[3,-1]]]);
 assert.ok(branched.nonManifoldVertices>=1);
 assert.ok(branched.openPaths>=1);
});
test("never silently discard excess section paths or malformed input",()=>{
 const lines=[[[0,0],[1,0]],[[10,0],[11,0]]];
 assert.equal(traceSectionSegments(lines,{maxPaths:1}).truncated,true);
 assert.throws(()=>traceSectionSegments([[[0,0],[NaN,0]]]),/INVALID_SECTION_SEGMENT/);
 assert.throws(()=>traceSectionSegments([], {maxPaths:0}),/INVALID_SECTION_SEGMENTS/);
});
