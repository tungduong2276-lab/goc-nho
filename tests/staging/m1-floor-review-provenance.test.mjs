import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {makeFloorAnnotation,buildFloorReviewBundle} from "../../src/house-floor-evidence.mjs";
import {buildFloorEvidenceWithProvenance,REVIEW_PROVENANCE_PROTOCOL} from "../../src/house-floor-review-provenance.mjs";

const raw=readFileSync("assets/3d/scene.json");
const scene=JSON.parse(raw);
const sha=createHash("sha256").update(raw).digest("hex");
const vertices=[[250,550],[350,550],[350,680],[250,680]];
const entry=makeFloorAnnotation({roomId:"phong-anh",role:"fixed_contact",layerId:"giuong_gon",vertices},scene);
const bundle=buildFloorReviewBundle([entry]);
const capture={roomId:"phong-anh",role:"fixed_contact",layerId:"giuong_gon",lighting:"ngay",visibleLayers:["giuong_gon","tudo_dong"]};
const make=(overrides={})=>buildFloorEvidenceWithProvenance({bundle,sceneSha256:sha,captures:[capture],...overrides});
const fails=(fn,code)=>assert.throws(fn,error=>error.code===code);
test("record source sha256, visible furniture, and source lighting without authorizing placement",()=>{
 const exportValue=make();
 assert.equal(exportValue.provenanceProtocol,REVIEW_PROVENANCE_PROTOCOL);
 assert.equal(exportValue.sceneSha256,sha);
 assert.equal(exportValue.captures[0].lighting,"ngay");
 assert.equal(exportValue.captures[0].visibleLayers.includes("giuong_gon"),true);
 assert.equal(exportValue.canPersist,false);
 assert.equal(exportValue.status,"UNAPPROVED");
 assert.equal(exportValue.readiness.length,6);
 assert.equal(exportValue.annotations.length,1);
});
test("reject missing, forged, duplicate or mismatched source context",()=>{
 fails(()=>make({sceneSha256:"0".repeat(63)}),"INVALID_SCENE_FINGERPRINT");
 fails(()=>make({captures:[]}),"INVALID_REVIEW_CAPTURES");
 fails(()=>make({captures:[{...capture,lighting:"sunset"}]}),"INVALID_REVIEW_CAPTURE");
 fails(()=>make({captures:[{...capture,roomId:"bep"}]}),"INVALID_REVIEW_CAPTURE");
 fails(()=>make({captures:[{...capture,layerId:"giuong_ngu"}]}),"INVALID_REVIEW_CAPTURE");
 fails(()=>make({captures:[{...capture,visibleLayers:["tudo_dong"]}]}),"MISSING_REVIEWED_CONTACT_STATE");
 fails(()=>make({captures:[{...capture,visibleLayers:["giuong_gon","giuong_gon"]}]}),"INVALID_REVIEW_CAPTURE");
 fails(()=>make({captures:[{...capture,visibleLayers:["giuong_gon","firebase/secret"]}]}),"INVALID_REVIEW_CAPTURE");
 fails(()=>make({bundle:{...bundle,canPersist:true}}),"INVALID_REVIEW_BUNDLE");
});
test("non-contact proposals can be reviewed with furniture hidden but remain unapproved",()=>{
 const floor=makeFloorAnnotation({roomId:"bep",role:"floor",vertices},scene);
 const b=buildFloorReviewBundle([floor]);
 const out=buildFloorEvidenceWithProvenance({bundle:b,sceneSha256:sha,captures:[
  {roomId:"bep",role:"floor",layerId:null,lighting:"dem",visibleLayers:[]}
 ]});
 assert.deepEqual(out.captures[0].visibleLayers,[]);
 assert.equal(out.canPersist,false);
});
