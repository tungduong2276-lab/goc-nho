import json,glob,os
from PIL import Image
OUT='/home/claude/v9/assets/3d/'
man=json.load(open(OUT+'scene.json'))
# lớp nhân vật: giữ khung 512 nhưng lưu kèm hộp cắt để nhẹ
rig={}
for f in sorted(glob.glob('out_rig/nv_*@3x.png')):
    n=os.path.basename(f).replace('@3x.png','')
    im=Image.open(f).convert('RGBA'); a=im.getchannel('A').point(lambda v:0 if v<6 else v); im.putalpha(a); bb=a.getbbox()
    if not bb: continue
    im.crop(bb).save(OUT+n+'.webp','WEBP',quality=84,method=6); rig[n]=list(bb)
rm=json.load(open('out_rig/meta.json'))['rig_meta']; rm['boxes']=rig; man['rig']=rm
# 5 phòng mới
m2=json.load(open('out_r2/meta.json')); rooms={}
for r in ['bep','phong_anh','phong_em','sang_tao','gac']:
    meta=m2[r+'_meta']
    for t in ['sang','ngay','chieu','dem']:
        Image.open(f'out_r2/{r}_{t}@3x.png').convert('RGBA').save(OUT+f'{r}_{t}.webp','WEBP',quality=84,method=6)
    lay={}
    for k,v in meta['items'].items():
        for st in v['st']:
            im=Image.open(f'out_r2/{r}_{k}_{st}@3x.png').convert('RGBA'); a=im.getchannel('A').point(lambda x:0 if x<10 else x); im.putalpha(a); bb=a.getbbox()
            im.crop(bb).save(OUT+f'{r}_{k}_{st}.webp','WEBP',quality=86,method=6); lay[f'{k}_{st}']=list(bb)
    meta['layers']=lay; rooms[r]=meta
man['rooms']=rooms
json.dump(man,open(OUT+'scene.json','w'),ensure_ascii=False,separators=(',',':'))
print(len(rig),'rig layers')
