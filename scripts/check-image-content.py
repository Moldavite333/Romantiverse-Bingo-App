"""Verify actual decoded pixels, dimensions, and perceptual duplicate candidates."""
import json,sys,itertools
from pathlib import Path
from PIL import Image,ImageOps
root=Path(__file__).resolve().parent.parent
entries=json.loads((root/'src/art/illustrations.json').read_text())
issues=[];fingerprints=[];sizes=[]
for e in entries:
    if not e.get('asset'):continue
    path=root/'public'/e['asset']
    if not path.exists():issues.append(e['id']+': missing asset');continue
    im=Image.open(path);im.load()
    if im.size!=(384,384):issues.append(e['id']+': unexpected dimensions '+str(im.size))
    sizes.append(path.stat().st_size)
    gray=ImageOps.grayscale(im).resize((17,16),Image.Resampling.LANCZOS)
    data=list(gray.tobytes())
    bits=[data[y*17+x]>data[y*17+x+1] for y in range(16) for x in range(16)]
    fingerprints.append((e['id'],bits))
candidates=[]
for (a,ha),(b,hb) in itertools.combinations(fingerprints,2):
    distance=sum(x!=y for x,y in zip(ha,hb))
    if distance<=24:candidates.append({'a':a,'b':b,'hammingDistance':distance})
report={'decodedImages':len(sizes),'totalBytes':sum(sizes),'maxBytes':max(sizes,default=0),'issues':issues,'nearDuplicateCandidates':candidates,'note':'Perceptual candidates require visual review; semantic associations require contact-sheet sign-off.'}
print(json.dumps(report,indent=2))
sys.exit(bool(issues or candidates))
