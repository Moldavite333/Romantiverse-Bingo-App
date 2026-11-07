import sharp from 'sharp';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const stage=process.argv[2];
if(!/^(baseline|stage-[1-4]-(before|after))$/.test(stage||''))throw Error('Supply baseline or stage-N-before/after');
const inventory=JSON.parse(await readFile('src/art/illustrations.json','utf8'));
const retained=process.argv.includes('--retained-only');
const assigned=new Set(inventory.map(e=>e.asset));
const unreferenced=(await readdir('public/illustrations')).filter(f=>f.endsWith('.webp')&&!assigned.has('illustrations/'+f)).map(f=>({id:'unreferenced-'+f.replace(/\.webp$/,''),label:'Unreferenced retained file: '+f,asset:'illustrations/'+f}));
const rows=retained?[...inventory.filter(e=>!e.active),...unreferenced]:inventory.filter(e=>e.active),out=`artifacts/refinement/${stage}`;
await mkdir(out,{recursive:true});
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
const coverage=[];
for(let start=0;start<rows.length;start+=12){
 const parts=[];
 for(const [i,e] of rows.slice(start,start+12).entries()){
  const x=(i%4)*400,y=Math.floor(i/4)*490;
  const bytes=await readFile('public/'+e.asset),meta=await sharp(bytes).metadata();
  const hash=createHash('sha256').update(bytes).digest('hex');
  coverage.push({id:e.id,label:e.label,asset:e.asset,sha256:hash,width:meta.width,height:meta.height,bytes:bytes.length});
  parts.push({input:await sharp(bytes).resize(384,384).png().toBuffer(),left:x+8,top:y});
  parts.push({input:await sharp(bytes).resize(64,64).png().toBuffer(),left:x+8,top:y+392});
  const lines=[''];for(const word of e.label.split(' ')){if((lines.at(-1)+' '+word).length>37)lines.push(word);else lines[lines.length-1]+=(lines.at(-1)?' ':'')+word;}
  const svg=`<svg width="320" height="100"><rect width="320" height="100" fill="#fff8ea"/><text x="4" y="14" font-family="Arial" font-size="11" fill="#20483f">${esc(e.id)}</text>${lines.map((l,j)=>`<text x="4" y="${34+j*17}" font-family="Arial" font-size="14" fill="#412835">${esc(l)}</text>`).join('')}</svg>`;
  parts.push({input:Buffer.from(svg),left:x+76,top:y+388});
 }
 await sharp({create:{width:1600,height:Math.ceil(Math.min(12,rows.length-start)/4)*490,channels:3,background:'#fff8ea'}}).composite(parts).png().toFile(`${out}/${retained?'retained-':''}page-${String(start/12+1).padStart(2,'0')}.png`);
}
const summary=retained?{...JSON.parse(await readFile(`${out}/coverage.json`,'utf8')),unreferencedImageFiles:unreferenced.length,retainedAssets:coverage}:{stage,activeTropes:rows.filter(e=>e.id!=='free').length,brandedCenters:rows.filter(e=>e.id==='free').length,archived:inventory.filter(e=>!e.active).length,missing:0,uniqueHashes:new Set(coverage.map(e=>e.sha256)).size,assets:coverage};
await writeFile(`${out}/coverage.json`,JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({...summary,assets:undefined,retainedAssets:undefined}));
