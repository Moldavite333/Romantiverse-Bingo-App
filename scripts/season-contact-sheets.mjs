import sharp from 'sharp';
import {readFile,mkdir} from 'node:fs/promises';
const rows=JSON.parse(await readFile('artifacts/season-sources.json','utf8')),before=process.argv.includes('--before');
await mkdir('artifacts/seasons/contact-sheets',{recursive:true});
for(const theme of ['Spring','Summer','No Season']){
 if(before&&theme!=='No Season')continue;
 const group=rows.filter(r=>r.theme===theme),cols=5,w=260,h=310;
 for(let start=0;start<group.length;start+=15){
  const batch=group.slice(start,start+15),layers=[];
  for(const [i,r] of batch.entries()){
   const x=i%cols*w,y=Math.floor(i/cols)*h;
   layers.push({input:await sharp((before?'artifacts/seasons/before/':'public/illustrations/')+r.id+'.webp').resize(250,250).toBuffer(),left:x+5,top:y});
   const escaped=r.label.replaceAll('&','&amp;').replaceAll('<','&lt;');
   const words=escaped.split(' '),lines=[''];for(const word of words){if((lines.at(-1)+' '+word).length>32)lines.push(word);else lines[lines.length-1]+=(lines.at(-1)?' ':'')+word}
   const svg=`<svg width="260" height="60"><text x="5" y="12" font-family="sans-serif" font-size="10">${r.id}</text>${lines.map((l,n)=>`<text x="5" y="${27+n*13}" font-family="sans-serif" font-size="12">${l}</text>`).join('')}</svg>`;
   layers.push({input:Buffer.from(svg),left:x,top:y+250});
  }
  await sharp({create:{width:cols*w,height:Math.ceil(batch.length/cols)*h,channels:3,background:'#fff8ea'}}).composite(layers).png().toFile(`artifacts/seasons/contact-sheets/${theme.replaceAll(' ','-')}-${before?'before-':''}${start/15+1}.png`);
 }
}
