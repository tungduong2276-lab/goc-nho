import json,os,glob
from PIL import Image
OUT='/home/claude/v8/assets/3d/'; os.makedirs(OUT,exist_ok=True)
Q=86
def webp(im,path,q=Q): im.save(path,'WEBP',quality=q,method=6)
man={}
# --- bản đồ: cắt bỏ phần biển trống phía dưới
mm=json.load(open('out_map/meta.json'))['ban_do_meta']
CROP=(0,0,1170,1960)
for t in ['sang','ngay','chieu','dem']:
    im=Image.open(f'out_map/ban_do_{t}@3x.png').convert('RGBA').crop(CROP); webp(im,OUT+f'ban_do_{t}.webp',84)
for i in (1,2,3):
    im=Image.open(f'out_map/may_{i}@3x.png').convert('RGBA'); im=im.crop(im.getbbox()); webp(im,OUT+f'may_{i}.webp',85); man.setdefault('may',[]).append(im.size)
mm['size']=[CROP[2],CROP[3]]
man['map']=mm
# --- phòng khách: nền 4 buổi + lớp rời cắt sát
rm=json.load(open('out_room/meta.json'))['phong_khach_meta']
for t in ['sang','ngay','chieu','dem']:
    webp(Image.open(f'out_room/phong_khach_{t}@3x.png').convert('RGBA'),OUT+f'phong_khach_{t}.webp',86)
layers={}
for f in sorted(glob.glob('out_room/pk_*@3x.png')):
    n=os.path.basename(f).replace('@3x.png','')
    im=Image.open(f).convert('RGBA'); bb=im.getbbox(); im=im.crop(bb); webp(im,OUT+n+'.webp',88)
    layers[n]=list(bb)
rm['layers']=layers; man['room']=rm
# --- nhân vật, thú, hoa
cm=json.load(open('out_ch/meta.json'))['nhan_vat_meta']; man['char']=cm
for f in glob.glob('out_ch/*.png'):
    n=os.path.basename(f).replace('@3x.png','')
    webp(Image.open(f).convert('RGBA'),OUT+n+'.webp',86)
fm=json.load(open('out_fl/meta.json'))['hoa_meta']; man['flower']=fm
for f in glob.glob('out_fl/*.png'):
    n=os.path.basename(f).replace('@3x.png','')
    webp(Image.open(f).convert('RGBA'),OUT+n+'.webp',86)
im=Image.open('out_brand/man_hinh_cho@3x.png').convert('RGBA'); bb=im.getbbox(); webp(im.crop(bb),OUT+'man_hinh_cho.webp',86)
json.dump(man,open(OUT+'scene.json','w'),ensure_ascii=False,separators=(',',':'))
# icon app
for n,f in [(512,'icon-512.png'),(192,'icon-192.png'),(180,'apple-touch-icon.png')]:
    Image.open(f'out_brand/icon-{n}.png').convert('RGB').save('/home/claude/v8/'+f,optimize=True)
Image.open('out_brand/icon-1024.png').convert('RGB').save('/home/claude/v8/icon-1024.png',optimize=True)
