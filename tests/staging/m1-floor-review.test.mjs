import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { makeFloorProposalPreview, FLOOR_PROPOSALS, FLOOR_REVIEW_STATUS } from "../../src/house-floor-review.mjs";
import { makePlacementPreview, applyPreviewAction, PlacementPreviewError } from "../../src/house-placement-preview.mjs";

const scene=JSON.parse(readFileSync("assets/3d/scene.json","utf8"));
const reject = config => assert.throws(
  () => makeFloorProposalPreview(scene,config),
  e => e instanceof PlacementPreviewError && e.code==="FLOOR_PROPOSAL_UNSAFE"
);
test("six independently proposed floor pairs are inside scene, away from standing anchors, but remain unapproved", () => {
  const draft=makeFloorProposalPreview(scene);
  assert.equal(draft.protocol,"LOCAL_PREVIEW_ONLY");
  assert.equal(draft.canPersist,false);
  assert.equal(draft.slots.length,12);
  assert.ok(draft.slots.every(s=>s.status===FLOOR_REVIEW_STATUS && s.x>=0 && s.y>=0 && s.x<=1170 && s.y<=1170));
  const original=makePlacementPreview(scene);
  assert.ok(draft.slots.some((s,i)=>s.x!==original.slots[i].x || s.y!==original.slots[i].y));
  assert.equal(JSON.stringify(scene),JSON.stringify(JSON.parse(readFileSync("assets/3d/scene.json","utf8"))));
});
test("placement is still only in immutable local draft; existing engine remains compatible",()=>{
  const before=makeFloorProposalPreview(scene);
  const next=applyPreviewAction(before,{kind:"place",id:"floor-proposal-1",roomId:"phong-em",slotId:"phong-em-candidate-1",assetType:"plant"});
  assert.equal(before.items.length,0);
  assert.equal(next.items.length,1);
  assert.equal(next.items[0].x,FLOOR_PROPOSALS["phong-em"][0][0]);
  assert.equal(next.canPersist,false);
});
test("fail closed for unknown rooms, invalid points, near-character or adjacent slots",()=>{
  reject({...FLOOR_PROPOSALS,unknown:[[200,700],[800,700]]});
  reject({...FLOOR_PROPOSALS,bep:[[Number.NaN,700],[640,910]]});
  reject({...FLOOR_PROPOSALS,bep:[[-1,700],[640,910]]});
  reject({...FLOOR_PROPOSALS,bep:[[585,598.7],[640,910]]});
  reject({...FLOOR_PROPOSALS,"phong-em":[[310,750],[350,760]]});
  reject({...FLOOR_PROPOSALS,gac:[[10,10]]});
});
