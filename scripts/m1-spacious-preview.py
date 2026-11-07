#!/usr/bin/env python3
"""Visual comparison only; do not overwrite shipped room assets or scene.json."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets/3d'
RENDER=ROOT/'out_spacious'
OUT=ROOT/'review-artifacts/house-spacious'
OUT.mkdir(parents=True,exist_ok=True)
scene=json.loads((ASSETS/'scene.json').read_text(encoding='utf-8'))
ROOMS={
  'phong-khach':{
    'prefix':'phong_khach',
    'sprites':['pk_sofa','pk_hu_day','pk_radio_tat','pk_khung_anh','pk_lich','pk_bang_ghim_trong'],
    'source':scene['room'],
  },
  'bep':{
    'prefix':'bep',
    'sprites':['tulanh_dong','bepnau_tat','banan_trong'],
    'source':scene['rooms']['bep'],
  },
}
def resized(image,rect):
    width,height=rect[2]-rect[0],rect[3]-rect[1]
    if image.size==(width,height):return image
    return image.resize((width,height),Image.Resampling.LANCZOS)
def existing(room):
    cfg=ROOMS[room]
    bg=Image.open(ASSETS/(cfg['prefix']+'_ngay.webp')).convert('RGBA')
    for name in cfg['sprites']:
        file=(name if room=='phong-khach' else 'bep_'+name)+'.webp'
        layer=Image.open(ASSETS/file).convert('RGBA')
        box=cfg['source']['layers'][name]
        bg.alpha_composite(resized(layer,box),(box[0],box[1]))
    return bg
def candidate(room):
    cfg=ROOMS[room]
    bg=Image.open(RENDER/(cfg['prefix']+'_ngay@3x.png')).convert('RGBA')
    for name in cfg['sprites']:
        file=(name if room=='phong-khach' else 'bep_'+name)+'@3x.png'
        fg=Image.open(RENDER/file).convert('RGBA')
        if fg.size!=bg.size:raise ValueError('Layer is not 1170x1170: '+file)
        bg.alpha_composite(fg)
    return bg
manifest={'review':'SOURCE_RENDER_PILOT_ONLY','approved':False,'canPersist':False,
  'sourceArtModified':False,'productionFirebaseTouched':False,'screenshots':[]}
for name in ROOMS:
    old,new=existing(name),candidate(name)
    if old.size!=(1170,1170) or new.size!=(1170,1170):
        raise ValueError('Expected source art 1170x1170')
    for image in [old,new]:
        if image.getbbox() is None:raise ValueError('Blank room render')
    full=Image.new('RGB',(1170*2,1170+70),'#fff9f4')
    full.paste(old,(0,70),old)
    full.paste(new,(1170,70),new)
    d=ImageDraw.Draw(full)
    d.text((16,20),'BEFORE / EXISTING ROOM',fill='#342c3a')
    d.text((1186,20),'AFTER / 3D SOURCE PILOT (UNAPPROVED)',fill='#342c3a')
    file='spacious-'+name+'-before-after.png'
    full.save(OUT/file,optimize=True)
    manifest['screenshots'].append({'room':name,'file':file,'width':full.width,'height':full.height})
(OUT/'spacious-scene-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('SPACIOUS_PILOT_VISUALS_OK',len(manifest['screenshots']))
