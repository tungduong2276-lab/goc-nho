import json,glob,os,re
from PIL import Image
OUT='/home/claude/v10/assets/3d/'
man=json.load(open(OUT+'scene.json'))
def crop_save(src,name,thr=8,q=86):
    im=Image.open(src).convert('RGBA');a=im.getchannel('A').point(lambda v:0 if v<thr else v);im.putalpha(a);bb=a.getbbox()
    if not bb: return None
    im.crop(bb).save(OUT+name+'.webp','WEBP',quality=q,method=6);return list(bb)
# vương quốc
km=json.load(open('out_kg/meta.json'))['dao_meta'];boxes={}
for t in ['sang','ngay','chieu','dem']: Image.open(f'out_kg/dao_{t}@3x.png').convert('RGBA').save(OUT+f'dao_{t}.webp','WEBP',quality=84,method=6)
for f in glob.glob('out_kg/*.png'):
    n=os.path.basename(f).replace('@3x.png','')
    if n.startswith('dao_'):continue
    b=crop_save(f,'kg_'+n)
    if b: boxes[n]=b
km['boxes']=boxes;man['kg']=km
# quán cà phê + bến thuyền: cùng cấu trúc với các phòng
om=json.load(open('out_od/meta.json'))
for r in ['quan_ca_phe','ben_thuyen']:
    meta=om[r+'_meta']
    for t in ['sang','ngay','chieu','dem']: Image.open(f'out_od/{r}_{t}@3x.png').convert('RGBA').save(OUT+f'{r}_{t}.webp','WEBP',quality=84,method=6)
    lay={}
    for k,v in meta['items'].items():
        for st in v['st']: lay[f'{k}_{st}']=crop_save(f'out_od/{r}_{k}_{st}@3x.png',f'{r}_{k}_{st}',10)
    meta['layers']=lay;man['rooms'][r]=meta
# lễ hội
fest={}
for f in glob.glob('out_fest/*.png'):
    n=os.path.basename(f).replace('@3x.png','')
    if n.endswith('_bando'):
        im=Image.open(f).convert('RGBA').crop((0,0,1170,1960));a=im.getchannel('A').point(lambda v:0 if v<8 else v);im.putalpha(a);bb=a.getbbox();im.crop(bb).save(OUT+n+'.webp','WEBP',quality=86,method=6);fest[n]=list(bb)
    else: fest[n]=crop_save(f,n)
man['fest']=fest
# thú cưng mới, hoa mới, sticker, huy hiệu
for f in glob.glob('out_pet/thu_*.png'): Image.open(f).convert('RGBA').save(OUT+os.path.basename(f).replace('@3x.png','.webp'),'WEBP',quality=86,method=6)
man['pets']=json.load(open('out_pet/meta.json'))['thu2_meta']
for t in ['camchuong','baby','lan','hoagiay','luuly','maivang']:
    for f in glob.glob(f'out_fl/hoa_{t}_*.png'): Image.open(f).convert('RGBA').save(OUT+os.path.basename(f).replace('@3x.png','.webp'),'WEBP',quality=86,method=6)
for f in glob.glob('out_stk/sticker_*.png')+glob.glob('out_stk/huy_hieu_*.png'):
    Image.open(f).convert('RGBA').save(OUT+os.path.basename(f).replace('@3x.png','.webp'),'WEBP',quality=88,method=6)
man['medals']=json.load(open('out_stk/meta.json'))['huy_hieu_meta']
json.dump(man,open(OUT+'scene.json','w'),ensure_ascii=False,separators=(',',':'))
print('ok',len(boxes),len(fest))
