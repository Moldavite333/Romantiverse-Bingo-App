import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const source=JSON.parse(await readFile('docs/artwork/generated-sources.json','utf8'));
const registry=JSON.parse(await readFile('src/engine/illustrationRegistry.json','utf8'));
await mkdir('public/illustrations',{recursive:true});
for(const {id,path} of source){
 if(!registry[id])throw Error('Unknown ID: '+id);
 await sharp(path).rotate().resize(384,384,{fit:'cover'}).webp({quality:78,effort:6}).toFile('public/'+registry[id].src);
 registry[id].status='ready';
}
const runtime=Object.fromEntries(Object.entries(registry).map(([id,{label,src,status}])=>[id,{id,label,src,status}]));
await writeFile('src/engine/illustrationRegistry.json',JSON.stringify(runtime,null,2)+'\n');
const specs=JSON.parse(await readFile('docs/artwork/scene-briefs.json','utf8'));
await writeFile('docs/artwork/scene-briefs.json',JSON.stringify(specs.map(s=>({...s,status:runtime[s.id].status})),null,2)+'\n');
console.log(`Imported ${source.length} optimized scene illustrations`);
