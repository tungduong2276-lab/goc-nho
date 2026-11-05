#!/usr/bin/env python3
"""Repack ONLY two bedrooms from verified Three.js source renders.
CI feature-branch only; never reads or writes Firebase or production files.
"""
import json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/'out_bedrooms'
ASSETS=ROOT/'assets/3d'
SCENE=ASSETS/'scene.json'
ROMS=('phong_anh','phong_em')
LIGHT=('sang','ngay','chieu','dem')
meta=json.loads((OUTPUT/'meta.json').read_text(encoding='utf-8'))
scene=json.loads(SCENE.read_text(encoding='utf-8'))
if any(room not in scene['rooms'] for room in ROMS):
    raise ValueError('UNKNOWN_BEDROOM')
manifest={'protocol':'M1_BEDROOM_ASSET_PACK_REVIEW',
    'rooms':list(ROMS),'source':'_xuong-3d/rooms2.js',
    'approval':'EXPERIMENTAL_ONLY','firebaseWrites':False,
    'otherRoomsPreserved':True,'generated':[]}
def read(name):
    img=Image.open(OUTPUT/name).convert('RGBA')
    if img.size!=(1170,1170):
        raise ValueError('NOT_1170_RENDER '+name)
    return img
def save(img,name,quality=86):
    img.save(ASSETS/name,'WEBP',quality=quality,method=6)
    manifest['generated'].append(name)
for room in ROMS:
    original=scene['rooms'][room]
    next_meta=meta[room+'_meta']
    if next_meta['size']!=[1170,1170] or next_meta['items']!=original['items']:
        raise ValueError('BEDROOM_SCHEMA_DRIFT '+room)
    if set(next_meta['spots'])!=set(original['spots']):
        raise ValueError('BEDROOM_SPOT_KEYS_CHANGED '+room)
    # These source positions were deliberately preserved by the redesign.
    for key,points in original['spots'].items():
        candidate=next_meta['spots'][key]
        if isinstance(points,list) and isinstance(candidate,list) and len(points)==len(candidate):
            if points and isinstance(points[0],list):
                for original_spot,next_spot in zip(points,candidate):
                    if any(abs(a-b)>1 for a,b in zip(original_spot,next_spot)):
                        raise ValueError('UNEXPECTED_STANDING_SPOT_SHIFT '+room+' '+key)
    for lighting in LIGHT:
        save(read(room+'_'+lighting+'@3x.png'),room+'_'+lighting+'.webp',84)
    layer_map={}
    for name,obj in original['items'].items():
        for state in obj['st']:
            key=name+'_'+state
            if key not in original['layers']:
                raise ValueError('MISSING_EXISTING_ITEM_LAYER '+room+'_'+key)
            image=read(room+'_'+key+'@3x.png')
            alpha=image.getchannel('A').point(lambda x:0 if x<10 else x)
            image.putalpha(alpha)
            bounds=alpha.getbbox()
            if bounds is None:
                raise ValueError('EMPTY_RENDER_LAYER '+room+'_'+key)
            layer_map[key]=list(bounds)
            save(image.crop(bounds),room+'_'+key+'.webp')
    if set(layer_map)!=set(original['layers']):
        raise ValueError('BEDROOM_RENDER_LAYER_SET_CHANGED '+room)
    scene['rooms'][room]={**original,**next_meta,'layers':layer_map}
    manifest[room]={'lights':len(LIGHT),'layers':len(layer_map),
                    'states':list(layer_map),
                    'standingPreserved':True}
SCENE.write_text(json.dumps(scene,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
manifest['assetCount']=len(manifest['generated'])
OUT=ROOT/'review-artifacts/bedroom-spacious'
OUT.mkdir(parents=True,exist_ok=True)
(OUT/'pack-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('BEDROOM_PACK_OK',manifest['assetCount'],manifest['rooms'])
