#!/usr/bin/env python3
"""Pack *all six* physical-expansion source scenes into WebP+scene metadata.
Only for isolated experimental PR branch. No Firebase, no app deploy.
"""
import json,copy
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"out_m1_physical";ASSETS=ROOT/"assets/3d";SCENE=ASSETS/"scene.json"
REV=ROOT/"review-artifacts/house-physical-expansion"
REV.mkdir(parents=True,exist_ok=True)
LIGHTS=("sang","ngay","chieu","dem")
ROOMS={
 "phong-khach":("phong_khach",[7,7]),
 "bep":("bep",[7,7]),
 "phong-anh":("phong_anh",[7,7]),
 "phong-em":("phong_em",[7,7]),
 "goc-sang-tao":("sang_tao",[7,7]),
 "gac":("gac",[7,5]),
}
data=json.loads(SCENE.read_text(encoding="utf-8"))
original=copy.deepcopy(data)
render_meta=json.loads((OUT/"meta.json").read_text(encoding="utf-8"))
generated=[]
def render(name):
 p=OUT/name
 if not p.is_file():raise ValueError("MISSING_3D_SOURCE_RENDER "+name)
 im=Image.open(p).convert("RGBA")
 if im.size!=(1170,1170):raise ValueError("INVALID_SOURCE_RENDER_SIZE "+name)
 return im
def save(im,name,quality=86):
 im.save(ASSETS/name,"WEBP",quality=quality,method=6)
 generated.append(name)
def layer(name,filename):
 im=render(name+"@3x.png")
 alpha=im.getchannel("A").point(lambda n:0 if n<10 else n)
 rect=alpha.getbbox()
 if not rect or rect[0]<0 or rect[1]<0 or rect[2]>1170 or rect[3]>1170:
  raise ValueError("EMPTY_OR_OUTSIDE_SOURCE_LAYER "+name)
 im.putalpha(alpha)
 save(im.crop(rect),filename,88)
 return list(rect)
manifest={"protocol":"M1_SIX_ROOM_PHYSICAL_ASSET_PACK_TRIAL","status":"NOT_APPROVED",
 "rooms":[],"generated":[],"productionFirebaseTouched":False,
 "allLegacyItemStateKeysPreserved":False,"mapPreserved":False,
 "canPersist":False}
for room_id,(prefix,world) in ROOMS.items():
 is_living=room_id=="phong-khach"
 old=original["room"] if is_living else original["rooms"][prefix]
 key="phong_khach_meta" if is_living else prefix+"_meta"
 proposed=render_meta.get(key)
 if not isinstance(proposed,dict) or proposed.get("size")!=[1170,1170]:
  raise ValueError("MISSING_SOURCE_META "+key)
 if proposed.get("ppm")!=96:
  raise ValueError("SOURCE_PPM_NOT_UPDATED "+key)
 if not is_living and proposed.get("items")!=old["items"]:
  raise ValueError("LEGACY_STATES_MISMATCH "+key)
 if not is_living and set(proposed.get("spots",{}))!=set(old.get("spots",{})):
  raise ValueError("ROOM_SPOT_KEYS_CHANGED "+key)
 for light in LIGHTS:save(render(prefix+"_"+light+"@3x.png"),prefix+"_"+light+".webp",85)
 expected_keys=set(old["layers"])
 if is_living:
  all_keys=sorted(expected_keys)
 else:
  all_keys=[item+"_"+state for item,entry in old["items"].items() for state in entry["st"]]
  if set(all_keys)!=expected_keys:raise ValueError("ROOM_LAYER_KEY_DRIFT "+room_id)
 boxes={}
 for name in all_keys:
  stem=name if is_living else prefix+"_"+name
  boxes[name]=layer(stem,stem+".webp")
 if set(boxes)!=expected_keys:raise ValueError("SPRITE_STATE_DROPPED "+room_id)
 update={**old,**proposed,
  "layers":boxes,
  "sourceWorldFloorMetres":world,
  "floorCollisionVerified":False,
  "doorwayWalkwayVerified":False}
 if is_living:data["room"]=update
 else:data["rooms"][prefix]=update
 manifest["rooms"].append({
  "roomId":room_id,"sourceWorldFloorMetres":world,
  "lightingRenders":len(LIGHTS),"layerCount":len(boxes),
  "legacyKeysPreserved":True,"sourceSpriteCanvas":[1170,1170],
  "approval":"TRIAL_SCENE_METADATA_ONLY"})
if data["map"]!=original["map"]:raise ValueError("HOUSE_OVERVIEW_MAP_MUTATED")
if set(data["rooms"])!=set(original["rooms"]):raise ValueError("ROOM_SET_DRIFT")
if set(data["room"]["layers"])!=set(original["room"]["layers"]):raise ValueError("LIVING_STATES_DRIFT")
for room_id,(prefix,_) in ROOMS.items():
 if room_id!="phong-khach" and set(data["rooms"][prefix]["layers"])!=set(original["rooms"][prefix]["layers"]):
  raise ValueError("ROOM_STATES_DRIFT "+room_id)
if len(generated)!=24+12+36:raise ValueError("SIX_ROOM_ASSET_COUNT_MISMATCH "+str(len(generated)))
SCENE.write_text(json.dumps(data,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
manifest["generated"]=generated
manifest["assetCount"]=len(generated)
manifest["allLegacyItemStateKeysPreserved"]=True
manifest["mapPreserved"]=True
(REV/"asset-pack-manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("M1_SIX_ROOM_EXPANDED_ASSET_PACK_SUCCESS",len(generated),"WebP sprites and backgrounds")
