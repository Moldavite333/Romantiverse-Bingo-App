// Small-size inspection sheets complement the native 384px sheets and hashes.
import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
const dir=process.argv[2],data=JSON.parse(await readFile(dir+'/coverage.json','utf8'));
const rows=[...data.assets,...(data.retainedAssets||[])],cols=12,w=128,h=106,perPage=96;
// Use the stage's captured native sheet pixels, never the possibly later live assets.
for(let start=0;start<rows.length;start+=perPage){
 const layers=[];
 for(let n=start;n<Math.min(rows.length,start+perPage);n++){
  const e=rows[n],retained=n>=data.assets.length,index=retained?n-data.assets.length:n;
  const page=Math.floor(index/12)+1,cell=index%12,x=(n-start)%cols*w,y=Math.floor((n-start)/cols)*h;
  const image=await sharp(`${dir}/${retained?'retained-':''}page-${String(page).padStart(2,'0')}.png`).extract({left:(cell%4)*400+8,top:Math.floor(cell/4)*490,width:384,height:384}).resize(64,64).png().toBuffer();
  layers.push({input:image,left:x+32,top:y});
  const words=e.id.match(/.{1,23}/g)||[];
  layers.push({input:Buffer.from(`<svg width="128" height="40">${words.map((l,i)=>`<text x="3" y="${11+i*11}" font-family="Arial" font-size="9">${l}</text>`).join('')}</svg>`),left:x,top:y+66});
 }
 await sharp({create:{width:cols*w,height:Math.ceil(Math.min(perPage,rows.length-start)/cols)*h,channels:3,background:'#fff8ea'}}).composite(layers).png().toFile(`${dir}/overview-${start/perPage+1}.png`);
}
await writeFile(dir+'/overview-coverage.json',JSON.stringify({images:rows.length,nativeSourceSheets:true,thumbnail:64,pages:Math.ceil(rows.length/perPage)},null,2)+'\n');
