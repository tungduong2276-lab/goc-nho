#!/usr/bin/env python3
"""Package ONLY Phòng khách and Bếp 3D art; preserve all other scenes/data.

Runs in GitHub Actions on experimental PR branch after rendering the source
geometry with Three.js. Never contacts Firebase. Fail closed on missing state
images or unexpected image shapes.
"""
import json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets/3d'
INPUT=ROOT/'out_spacious'
META=INPUT/'meta.json'
SCENE=ASSETS/'scene.json'
SIZE=(1170,1170)
TIMES=('sang','ngay','chieu','dem')
if not META.is_file() or not SCENE.is_file():
    raise SystemExit("SPACIOUS_PACK_MISSING_RENDER_META")
meta=json.loads(META.read_text(encoding='utf-8'))
scene=json.loads(SCENE.read_text(encoding='utf-8'))
if 'room' not in scene or 'bep' not in scene.get('rooms',{}):
    raise SystemExit('SPACIOUS_PACK_MISSING_EXISTING_ROOMS')
manifest={'protocol':'M1_SPACIOUS_ASSET_REPACK', 'rooms':['phong-khach','bep'],
          'generated':[], 'preservedOthers':True, 'firebaseWrites':False}
def load(name):
    src=INPUT/name
    if not src.is_file():raise ValueError('SPACIOUS_PACK_MISSING_RENDER '+name)
    im=Image.open(src).convert('RGBA')
    if im.size!=SIZE:raise ValueError('SPACIOUS_PACK_INVALID_RENDER_SIZE '+name)
    return im
def save(im,name,quality):
    im.save(ASSETS/name,'WEBP',quality=quality,method=6)
    manifest['generated'].append(name)
def cropped(name,quality,alpha_cutoff=0):
    im=load(name+'@3x.png')
    if alpha_cutoff:
        channel=im.getchannel('A').point(lambda x:0 if x<alpha_cutoff else x)
        im.putalpha(channel)
    bbox=im.getbbox()
    if not bbox:raise ValueError('SPACIOUS_PACK_EMPTY_SPRITE '+name)
    save(im.crop(bbox),name+'.webp',quality)
    return list(bbox)
# 1) Four times of day and all living-room interactive states.
room_meta=meta.get('phong_khach_meta')
if not isinstance(room_meta,dict):raise ValueError('MISSING_LIVING_META')
for time in TIMES:
    save(load(f'phong_khach_{time}@3x.png'),f'phong_khach_{time}.webp',86)
layers={}
# Use the pre-existing sprite keys exactly to prevent deleting interaction states.
for layer_id in scene['room']['layers'].keys():
    layers[layer_id]=cropped(layer_id,88)
if set(layers)!=set(scene['room']['layers']):raise ValueError('LIVING_LAYER_DRIFT')
scene['room']={**scene['room'],**room_meta,'layers':layers}
# 2) Four times of day and each kitchen item/state, including open/closed and cooking.
kitchen_meta=meta.get('bep_meta')
if not isinstance(kitchen_meta,dict):raise ValueError('MISSING_KITCHEN_META')
for time in TIMES:
    save(load(f'bep_{time}@3x.png'),f'bep_{time}.webp',84)
kitchen_layers={}
old_layers=scene['rooms']['bep']['layers']
items=scene['rooms']['bep']['items']
if kitchen_meta.get('items')!=items:
    raise ValueError('KITCHEN_STATES_CHANGED')
for item_id,item in items.items():
    for state in item['st']:
        key=f'{item_id}_{state}'
        if key not in old_layers:raise ValueError('KITCHEN_STATE_NOT_IN_OLD_SCENE '+key)
        kitchen_layers[key]=cropped('bep_'+key,86,10)
if set(kitchen_layers)!=set(old_layers):raise ValueError('KITCHEN_LAYER_DRIFT')
scene['rooms']['bep']={**scene['rooms']['bep'],**kitchen_meta,'layers':kitchen_layers}
if scene['room']['size']!=[1170,1170] or scene['rooms']['bep']['size']!=[1170,1170]:
    raise ValueError('SCENE_DIMENSIONS_CHANGED')
SCENE.write_text(json.dumps(scene,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
manifest['livingLayers']=len(layers)
manifest['kitchenLayers']=len(kitchen_layers)
manifest['changedFiles']=len(manifest['generated'])+1
OUT=ROOT/'review-artifacts/house-spacious'
OUT.mkdir(parents=True,exist_ok=True)
(OUT/'pack-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('SPACIOUS_PACK_SUCCESS',json.dumps({k:manifest[k] for k in ['livingLayers','kitchenLayers','changedFiles']}))
