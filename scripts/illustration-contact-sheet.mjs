import sharp from 'sharp';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const rows=Object.values(JSON.parse(await readFile('src/engine/illustrationRegistry.json','utf8')));
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
await mkdir('artifacts/artwork',{recursive:true});
const cols=6,cellW=190,cellH=248,perPage=24;
for(let start=0;start<rows.length;start+=perPage){
 const page=rows.slice(start,start+perPage),composites=[];
 for(let i=0;i<page.length;i++){
  const row=page[i],left=i%cols*cellW,top=Math.floor(i/cols)*cellH;
  if(row.status==='ready')composites.push({input:await sharp('public/'+row.src).resize(172,172).toBuffer(),left:left+9,top:top+8});
  const words=row.label.split(' '),lines=[''];for(const word of words){if((lines.at(-1)+' '+word).length>24)lines.push(word);else lines[lines.length-1]+=(lines.at(-1)?' ':'')+word}
  const svg=`<svg width="190" height="62"><rect width="190" height="62" fill="#fff8ea"/><text x="8" y="12" font-size="9" font-family="sans-serif" fill="#20483f">${escape(row.id)}</text>${lines.slice(0,3).map((l,i)=>`<text x="8" y="${28+i*13}" font-family="sans-serif" font-size="11" fill="#412835">${escape(l)}</text>`).join('')}</svg>`;
  composites.push({input:Buffer.from(svg),left,top:top+180});
 }
 await sharp({create:{width:cols*cellW,height:Math.ceil(page.length/cols)*cellH,channels:3,background:'#fff8ea'}}).composite(composites).png().toFile(`artifacts/artwork/contact-${start/perPage+1}.png`);
}
for(const row of rows)if(row.status==='ready')row.preview='data:image/webp;base64,'+(await sharp('public/'+row.src).resize(172,172).webp({quality:72}).toBuffer()).toString('base64');
await writeFile('artifacts/artwork/contact-sheet.html',`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>All ${rows.length-1} tropes and branded center</title><style>body{background:#fff8ea;color:#20483f;font:14px system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:16px}figure{margin:0}img{width:100%;aspect-ratio:1;object-fit:cover}small{display:block}figcaption{min-height:60px}</style><h1>${rows.length-1} canonical tropes + Cheese Louise center</h1><p>Artwork review: 384 px assets shown at card scale. Missing assets are explicitly labelled.</p><main>${rows.map(r=>`<figure>${r.status==='ready'?`<img src="${r.preview}" alt="${escape(r.label)}">`:'<p>ILLUSTRATION UNAVAILABLE</p>'}<figcaption><small>${r.id}</small>${escape(r.label)}</figcaption></figure>`).join('')}</main></html>`);
console.log('Contact sheet: artifacts/artwork/contact-sheet.html; seven PNG review pages');
