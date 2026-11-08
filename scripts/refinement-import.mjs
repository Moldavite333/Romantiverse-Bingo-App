import sharp from 'sharp';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const map=JSON.parse(await readFile(process.argv[2],'utf8'));
const entries=JSON.parse(await readFile('src/art/illustrations.json','utf8'));
const registry=JSON.parse(await readFile('src/engine/illustrationRegistry.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const sourceDir=process.argv.find(arg=>arg.startsWith('--source-dir='))?.slice('--source-dir='.length)||'artifacts/refinement/sources';
await mkdir(sourceDir,{recursive:true});
for(const {id,source} of map){
 const e=entries.find(e=>e.id===id);
 if(!e||!e.active||e.id==='free')throw Error('Only active trope artwork may be replaced');
 const bytes=await readFile(source);
 const metadata=await sharp(bytes).metadata();
 if(metadata.width!==metadata.height)throw Error('Source must be square');
 const asset=await sharp(bytes).resize(384,384).webp({quality:84,effort:6}).toBuffer();
 if(asset.length>80000)throw Error('Asset exceeds budget');
 await copyFile(source,`${sourceDir}/${id}.png`);
 await writeFile('public/'+e.asset,asset);
 Object.assign(e,{sourceSha256:sha(bytes),assetSha256:sha(asset),generated:true,reviewed:false});
 Object.assign(registry[id],{assetSha256:e.assetSha256,status:'pending'});
 console.log(`${id}: ${asset.length} bytes; pending visual review`);
}
await writeFile('src/art/illustrations.json',JSON.stringify(entries,null,2)+'\n');
await writeFile('src/engine/illustrationRegistry.json',JSON.stringify(registry,null,2)+'\n');
