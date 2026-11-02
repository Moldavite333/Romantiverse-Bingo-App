"""Optimize generated sources and create labeled contact sheets. Pillow required.
Usage: python scripts/prepare-illustration-assets.py source-map.json output-directory
Source map: [{id, source}]. No inferred file-to-trope associations are permitted.
"""
import json,sys,hashlib,textwrap
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root=Path(__file__).resolve().parent.parent
sources=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8-sig'))
out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
entries=json.loads((root/'src/art/illustrations.json').read_text(encoding='utf-8'))
by_id={e['id']:e for e in entries}
for item in sources:
    entry=by_id[item['id']]
    image=Image.open(item['source']).convert('RGB')
    if image.width!=image.height: raise ValueError('Non-square source: '+entry['id'])
    image=image.resize((384,384),Image.Resampling.LANCZOS)
    image.save(root/'public'/entry['asset'],format='WEBP',quality=84,method=6)
    entry['sourceSha256']=hashlib.sha256(Path(item['source']).read_bytes()).hexdigest()
    asset_hash=hashlib.sha256((root/'public'/entry['asset']).read_bytes()).hexdigest()
    if entry.get('assetSha256')!=asset_hash: entry['reviewed']=False
    entry['assetSha256']=asset_hash
    entry['generated']=True
(root/'src/art/illustrations.json').write_text(json.dumps(entries,indent=2)+'\n',encoding='utf-8')
(root/'public/illustrations/manifest.json').write_text(json.dumps([e['asset'] for e in entries if e['active'] and e['asset']],indent=2)+'\n')
try:
    font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',14)
    small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',11)
except OSError:
    font=small=ImageFont.load_default()
for page,start in enumerate(range(0,len(entries),24),1):
    canvas=Image.new('RGB',(1200,1460),'#fffaf0');draw=ImageDraw.Draw(canvas)
    draw.text((24,16),f'ROMANTIVERSE BINGO | Illustration review {page}',font=font,fill='#173f36')
    for n,e in enumerate(entries[start:start+24]):
        x=20+(n%6)*198;y=52+(n//6)*350
        path=root/'public'/e['asset'] if e['asset'] else None
        if path and path.exists():
            image=Image.open(path).convert('RGB');image.thumbnail((180,180));canvas.paste(image,(x,y))
            tiny=image.resize((64,64),Image.Resampling.LANCZOS);canvas.paste(tiny,(x,y+190))
        else:
            draw.rectangle((x,y,x+180,y+180),outline='#c43e46');draw.text((x+12,y+80),'PENDING',font=font,fill='#c43e46')
        for row,line in enumerate(textwrap.wrap(e['label'],23)):
            draw.text((x,y+262+row*17),line,font=font,fill='#173f36')
        draw.text((x,y+319),e['id'],font=small,fill='#65443e')
        if not e['active']:draw.text((x+70,y+224),'ARCHIVED',font=small,fill='#65443e')
    canvas.save(out/f'contact-sheet-{page:02}.png')
print(json.dumps({'optimized':len(sources),'registered':len(entries),'contactSheets':page}))
