#!/usr/bin/env python3
"""Review-only actual Three.js six-room wider-world vs shipped composites.
Does not write the app assets/scene.json, Firebase or any deployment config.
"""
import json
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/"assets/3d"
GENERATED=ROOT/"out_m1_physical"
OUTPUT=ROOT/"review-artifacts/house-physical-expansion"
OUTPUT.mkdir(parents=True,exist_ok=True)
scene=json.loads((ASSETS/"scene.json").read_text(encoding="utf-8"))
meta=json.loads((GENERATED/"meta.json").read_text(encoding="utf-8"))
ROOMS={
 "phong-khach":("phong_khach",6,6,7,7),
 "bep":("bep",6,6,7,7),
 "phong-anh":("phong_anh",6,6,7,7),
 "phong-em":("phong_em",6,6,7,7),
 "goc-sang-tao":("sang_tao",6,6,7,7),
 "gac":("gac",6,4,7,5)
}
def comp_old(room,prefix):
 dat=scene["room"] if room=="phong-khach" else scene["rooms"][prefix]
 bg=Image.open(ASSETS/(prefix+"_ngay.webp")).convert("RGBA")
 if room=="phong-khach":
  keys=["pk_sofa","pk_khung_anh","pk_lich","pk_bang_ghim_trong","pk_radio_tat","pk_hu_day"]
  name=lambda key:key+".webp"
 else:
  keys=[k+"_"+v["st"][0] for k,v in dat["items"].items()]
  name=lambda key:prefix+"_"+key+".webp"
 for key in keys:
  crop=Image.open(ASSETS/name(key)).convert("RGBA")
  box=dat["layers"][key]
  size=(box[2]-box[0],box[3]-box[1])
  if crop.size!=size:
   crop=crop.resize(size,Image.Resampling.LANCZOS)
  bg.alpha_composite(crop,(box[0],box[1]))
 return bg,keys
def comp_new(room,prefix,keys):
 bg=Image.open(GENERATED/(prefix+"_ngay@3x.png")).convert("RGBA")
 for key in keys:
  name=(key if room=="phong-khach" else prefix+"_"+key)+"@3x.png"
  layer=Image.open(GENERATED/name).convert("RGBA")
  if layer.size!=bg.size:raise ValueError("BAD_NEW_LAYER_SIZE "+name)
  bg.alpha_composite(layer)
 return bg
manifest={"status":"UNAPPROVED_SOURCE_EXPANSION_ONLY","canPersist":False,
          "appAssetsModified":False,"firebaseWrites":False,"rooms":[]}
for name,(prefix,n,d,n2,d2) in ROOMS.items():
 old,keys=comp_old(name,prefix)
 new=comp_new(name,prefix,keys)
 if old.size!=(1170,1170) or new.size!=(1170,1170):
  raise ValueError("SOURCE_IMAGE_DIMENSION_CHANGED "+name)
 if not old.getbbox() or not new.getbbox():raise ValueError("EMPTY_ROOM "+name)
 room_meta=meta.get("phong_khach_meta" if name=="phong-khach" else prefix+"_meta")
 if not room_meta or room_meta.get("size")!=[1170,1170]:
  raise ValueError("INVALID_SOURCE_META "+name)
 if name!="phong-khach" and room_meta.get("items")!=scene["rooms"][prefix].get("items"):
  raise ValueError("INTERACTIVE_STATE_KEYS_CHANGED "+name)
 out=Image.new("RGB",(2340,1230),"#fff9f5")
 out.paste(old,(0,60),old);out.paste(new,(1170,60),new)
 canvas=ImageDraw.Draw(out)
 canvas.text((20,16),name+" / current real app render "+str(n*d)+" m2",fill="#382840")
 canvas.text((1190,16),name+" / NEW Three.js shell "+str(n2*d2)+" m2 (review only)",fill="#382840")
 fname=name+"-world-floor-before-after.png"
 out.save(OUTPUT/fname,optimize=True)
 manifest["rooms"].append({
  "room":name,"oldWorldM":[n,d],"newWorldM":[n2,d2],
  "floorAreaM2Before":n*d,"floorAreaM2After":n2*d2,
  "physicalAreaGainM2":n2*d2-n*d,
  "physicalAreaGainPercent":round((n2*d2/(n*d)-1)*100,1),
  "file":fname,"sourceImageSize":[1170,1170],
  "defaultSpriteCount":len(keys),
  "renderStatus":"3D_REAL_WORLD_GEOMETRY_NOT_SHIPPED"
 })
(OUTPUT/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("M1_REAL_SIX_ROOM_WORLD_AREA_REVIEW",len(manifest["rooms"]),"rooms")
