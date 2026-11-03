# Bản 12: tab Gửi nhau 3D. Chạy: python3 pack5.py <thư-mục-ra-của-gui_nhau.js> <thư-mục assets/3d>
import json, sys
from PIL import Image
SRC, OUT = sys.argv[1].rstrip('/') + '/', sys.argv[2].rstrip('/') + '/'
man = json.load(open(OUT + 'scene.json'))
def crop_save(src, name, thr=10, q=86):
    im = Image.open(src).convert('RGBA'); a = im.getchannel('A').point(lambda v: 0 if v < thr else v); im.putalpha(a); bb = a.getbbox()
    if not bb: return None
    im.crop(bb).save(OUT + name + '.webp', 'WEBP', quality=q, method=6); return list(bb)
r = 'gui_nhau'; meta = json.load(open(SRC + 'meta.json'))[r + '_meta']
for t in ['sang', 'ngay', 'chieu', 'dem']:
    Image.open(SRC + f'{r}_{t}@3x.png').convert('RGBA').save(OUT + f'{r}_{t}.webp', 'WEBP', quality=84, method=6)
lay = {}
for k, v in meta['items'].items():
    for st in v['st']: lay[f'{k}_{st}'] = crop_save(SRC + f'{r}_{k}_{st}@3x.png', f'{r}_{k}_{st}')
meta['layers'] = lay; man['rooms'][r] = meta
json.dump(man, open(OUT + 'scene.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('ok', lay)
