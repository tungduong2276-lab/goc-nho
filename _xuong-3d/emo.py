from PIL import Image
import json,os
D='out_rig/';FX='out_stk/';OUT='out_stk/'
DEF={'anh':dict(hair='nganxu',hc='dennau',top='hoodie',bot='quandai',hat='khong',acc='tainghe'),'em':dict(hair='daixoa',hc='hatde',top='vayyem',bot='giayvai',hat='khong',acc='kepla')}
def stack(look,pose,ex):
    im=Image.new('RGBA',(512,512),(0,0,0,0))
    parts=['nv_than_'+pose,f"nv_quan_{look['bot']}_{pose}",f"nv_ao_{look['top']}_{pose}",f"nv_mat_{ex}_{pose}",f"nv_toc_{look['hair']}_{look['hc']}_{pose}"]
    if look['acc']!='khong':parts.append(f"nv_pk_{look['acc']}_{pose}")
    for p in parts:
        f=D+p+'@3x.png'
        if os.path.exists(f): im.alpha_composite(Image.open(f).convert('RGBA'))
    return im
def fx(name,size):return Image.open(FX+f'fx_{name}@3x.png').convert('RGBA').resize((size,size),Image.LANCZOS)
KINDS={'vaytay':('vaytay',None,[]),'omtim':('dung','ngung',[('tim',150,(186,230))]),'khocnhe':('dung','nho',[('nuocmat',116,(198,246))]),
 'gian':('dung','doi',[('gian',90,(330,70))]),'dingu':('dung','ngu',[('zzz',110,(320,40))]),'nhoqua':('dung','nho',[('tim',70,(330,80)),('tim',50,(120,90))])}
names={}
for who in ['anh','em']:
    for k,(pose,ex,ov) in KINDS.items():
        e=ex or ('cuoi' if who=='anh' else 'vui')
        im=stack(DEF[who],pose,e)
        for n,sz,(x,y) in ov: im.alpha_composite(fx(n,sz),(x,y))
        crop=im.crop((56,10,456,410)).resize((192,192),Image.LANCZOS)
        crop.save(OUT+f'sticker_me_{who}_{k}@3x.png')
