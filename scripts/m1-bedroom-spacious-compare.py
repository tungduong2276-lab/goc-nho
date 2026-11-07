#!/usr/bin/env python3
"""Compare the actual shipped bedroom composite with source-rendered proposal.
Artifacts only. No application assets or scene.json are modified.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets/3d'
GENERATED=ROOT/'out_bedrooms'
DEST=ROOT/'review-artifacts/bedroom-spacious'
DEST.mkdir(parents=True,exist_ok=True)
scene=json.loads((ASSETS/'scene.json').read_text(encoding='utf-8'))
names={'phong_anh':'Phòng Anh','phong_em':'Phòng Em'}
result={'protocol':'BEDROOM_SOURCE_COMPARISON_NOT_APPROVED','canPersist':False,
        'physicalContactVerified':False,'floorBoundaryVerified':False,
        'productionAssetsModified':False,'images':[]}
for room,label in names.items():
    existing=Image.open(ASSETS/(room+'_ngay.webp')).convert('RGBA')
    proposed=Image.open(GENERATED/(room+'_ngay@3x.png')).convert('RGBA')
    if existing.size!=(1170,1170) or proposed.size!=(1170,1170):
        raise ValueError('ROOM_CANVAS_SIZE_MISMATCH '+room)
    data=scene['rooms'][room]
    for obj,item in data['items'].items():
        state=item['st'][0]
        key=obj+'_'+state
        source_box=data['layers'][key]
        old_sprite=Image.open(ASSETS/(room+'_'+key+'.webp')).convert('RGBA')
        w,h=source_box[2]-source_box[0],source_box[3]-source_box[1]
        if old_sprite.size!=(w,h):
            old_sprite=old_sprite.resize((w,h),Image.Resampling.LANCZOS)
        existing.alpha_composite(old_sprite,(source_box[0],source_box[1]))
        next_sprite=Image.open(GENERATED/(room+'_'+key+'@3x.png')).convert('RGBA')
        if next_sprite.size!=(1170,1170):
            raise ValueError('RENDER_LAYER_SIZE_MISMATCH '+room+' '+key)
        proposed.alpha_composite(next_sprite)
    out=Image.new('RGB',(2340,1240),'#fff9f4')
    out.paste(existing,(0,70),existing)
    out.paste(proposed,(1170,70),proposed)
    draw=ImageDraw.Draw(out)
    draw.text((18,20),label+' / OLD COMPOSITE',fill='#332d38')
    draw.text((1188,20),label+' / NEW SOURCE PREVIEW - NOT APPROVED',fill='#332d38')
    filename='bedroom-'+room+'-before-after.png'
    out.save(DEST/filename,optimize=True)
    result['images'].append({'room':room,'filename':filename,'sourceViewport':[1170,1170],
                             'existingLayers':len(data['items'])})
(DEST/'manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('BEDROOM_PILOT_IMAGES_OK',len(result['images']))
