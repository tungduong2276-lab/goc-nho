/**
 * M1 independent provenance of manually drawn candidate floor geometry.
 * Descriptive audit metadata only: NEVER authorizes placement/persistence.
 */
import {PlacementPreviewError,ROOM_SOURCES} from "./house-placement-preview.mjs";
import {FLOOR_EVIDENCE_PROTOCOL,FLOOR_ROLES} from "./house-floor-evidence.mjs";
export const REVIEW_PROVENANCE_PROTOCOL="M1_FLOOR_SOURCE_PROVENANCE_UNAPPROVED";
const LIGHTS=Object.freeze(["sang","ngay","chieu","dem"]);
const fail=code=>{throw new PlacementPreviewError(code);};
export function buildFloorEvidenceWithProvenance({bundle,sceneSha256,captures}){
 if(!bundle||bundle.protocol!==FLOOR_EVIDENCE_PROTOCOL||
    bundle.status!=="UNAPPROVED"||bundle.canPersist!==false||
    !Array.isArray(bundle.annotations)||!Array.isArray(bundle.readiness))
  fail("INVALID_REVIEW_BUNDLE");
 if(typeof sceneSha256!=="string"||!/^[a-f0-9]{64}$/.test(sceneSha256))
  fail("INVALID_SCENE_FINGERPRINT");
 if(!Array.isArray(captures)||captures.length!==bundle.annotations.length)
  fail("INVALID_REVIEW_CAPTURES");
 const reviewed=captures.map((capture,i)=>{
  const annotation=bundle.annotations[i];
  if(!capture||!annotation||!Object.hasOwn(ROOM_SOURCES,capture.roomId)||
    capture.roomId!==annotation.roomId||
    !FLOOR_ROLES.includes(capture.role)||capture.role!==annotation.role||
    capture.layerId!==annotation.layerId||
    !LIGHTS.includes(capture.lighting)||
    !Array.isArray(capture.visibleLayers)||capture.visibleLayers.length>48||
    capture.visibleLayers.some(layer=>typeof layer!=="string"||!/^[a-z0-9_-]{1,80}$/.test(layer))||
    new Set(capture.visibleLayers).size!==capture.visibleLayers.length)
   fail("INVALID_REVIEW_CAPTURE");
  if(capture.role==="fixed_contact"&&!capture.visibleLayers.includes(capture.layerId))
   fail("MISSING_REVIEWED_CONTACT_STATE");
  return Object.freeze({
   roomId:capture.roomId,role:capture.role,layerId:capture.layerId,
   lighting:capture.lighting,visibleLayers:Object.freeze([...capture.visibleLayers]),
   status:"SOURCE_CONTEXT_ONLY_UNAPPROVED"});
 });
 return Object.freeze({...bundle,
  sceneSha256,provenanceProtocol:REVIEW_PROVENANCE_PROTOCOL,
  captures:Object.freeze(reviewed),canPersist:false,status:"UNAPPROVED"});
}
