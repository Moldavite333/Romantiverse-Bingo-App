// Re-export genuine source pixels; no sharpening, recoloring or synthetic upscaling.
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const root='artifacts/detail-cleanup',pass=Number(process.argv.find(a=>a.startsWith('--pass='))?.split('=')[1]||1);
assert.ok([1,2].includes(pass));
const audit=JSON.parse(await readFile(`${root}/source-audit.json`));
const entries=JSON.parse(await readFile('src/art/illustrations.json'));
const registry=JSON.parse(await readFile('src/engine/illustrationRegistry.json'));
const edits=pass===2?JSON.parse(await readFile(`${root}/edits.json`)):[];
const briefs=JSON.parse(await readFile('docs/artwork/scene-briefs.json'));
const sha=b=>createHash('sha256').update(b).digest('hex');
await mkdir('public/illustrations/detail',{recursive:true});await mkdir(`${root}/sources`,{recursive:true});
const results=[];
for(const e of entries.filter(e=>e.active&&e.id!=='free')){
 const edit=edits.find(x=>x.id===e.id);if(pass===2&&!edit)continue;
 const original=audit.rows.find(r=>r.id===e.id);assert.ok(original?.source);
 const source=edit?.source||original.source.path,bytes=await readFile(source),meta=await sharp(bytes).metadata();
 assert.equal(meta.width,meta.height);assert.ok(meta.width>=768);
 if(!edit)assert.equal(sha(bytes),e.sourceSha256,`${e.id}: source mismatch`);
 let quality=90,small;
 do{small=await sharp(bytes).resize(384,384).webp({quality,effort:6}).toBuffer();if(small.length<=80000)break;quality--}while(quality>=84);
 assert.ok(small.length<=80000);
 let detailQuality=88,detail;
 do{detail=await sharp(bytes).resize(768,768).webp({quality:detailQuality,effort:6}).toBuffer();if(detail.length<=260000)break;detailQuality--}while(detailQuality>=80);
 assert.ok(detail.length<=260000);
 const detailAsset=`illustrations/detail/${e.id}.webp`;
 await writeFile('public/'+e.asset,small);await writeFile('public/'+detailAsset,detail);
 Object.assign(e,{assetSha256:sha(small),detailAsset,detailSha256:sha(detail),reviewed:true});
 Object.assign(registry[e.id],{assetSha256:e.assetSha256,status:'ready'});
 if(edit){
  const saved=`${root}/sources/${e.id}.png`;await copyFile(source,saved);e.sourceSha256=sha(bytes);
  const b=briefs.find(b=>b.id===e.id);b.refinements??=[];b.refinements.push({stage:'detail-cleanup',prompt:edit.prompt,source:saved,sourceSha256:e.sourceSha256});
 }
 results.push({id:e.id,sourceSha256:e.sourceSha256,sourcePixels:meta.width,smallBytes:small.length,quality,detailBytes:detail.length,detailQuality,assetSha256:e.assetSha256,detailSha256:e.detailSha256,repainted:!!edit});
}
await writeFile('src/art/illustrations.json',JSON.stringify(entries,null,2)+'\n');
await writeFile('src/engine/illustrationRegistry.json',JSON.stringify(registry,null,2)+'\n');
await writeFile('docs/artwork/scene-briefs.json',JSON.stringify(briefs,null,2)+'\n');
await writeFile(`${root}/pass-${pass}-exports.json`,JSON.stringify(results,null,2)+'\n');
if(pass===2)await writeFile('docs/artwork/detail-cleanup-prompts.json',JSON.stringify({mode:'built-in image_gen',acceptedEdits:edits.length,edits:edits.map(({source,...e})=>({...e,source:`${root}/sources/${e.id}.png`}))},null,2)+'\n');
console.log(`Pass ${pass}: ${results.length} source-based export pairs; ${results.filter(r=>r.repainted).length} painted edits.`);
