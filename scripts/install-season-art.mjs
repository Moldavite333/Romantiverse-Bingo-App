import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const rows=JSON.parse(await readFile(process.argv[2]||'artifacts/season-sources.json','utf8'));
const entries=JSON.parse(await readFile('src/art/illustrations.json','utf8'));
const registry=JSON.parse(await readFile('src/engine/illustrationRegistry.json','utf8'));
const briefs=JSON.parse(await readFile('docs/artwork/scene-briefs.json','utf8'));
const aliases=JSON.parse(await readFile('src/art/room-illustration-aliases.json','utf8'));
const engineAliases=JSON.parse(await readFile('src/engine/roomIllustrationAliases.json','utf8'));
const shortLabels=JSON.parse(await readFile('src/engine/shortLabels.json','utf8'));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
await mkdir('artifacts/seasons/sources',{recursive:true});await mkdir('artifacts/seasons/before',{recursive:true});
for(const row of rows){
 const source=await readFile(row.path),asset=`illustrations/${row.id}.webp`,prior=entries.find(e=>e.id===row.id);
 if(prior)try{await copyFile('public/'+asset,'artifacts/seasons/before/'+row.id+'.webp')}catch{}
 await writeFile(`artifacts/seasons/sources/${row.id}.png`,source);
 const bytes=await sharp(source).resize(384,384,{fit:'cover'}).webp({quality:83}).toBuffer();
 if(bytes.length>80000)throw Error(`Oversize image ${row.id}`);
 await writeFile('public/'+asset,bytes);
 const entry={id:row.id,label:row.label,active:true,asset,scene:row.scene,reviewed:false,sourceSha256:digest(source),assetSha256:digest(bytes),generated:true};
 if(prior)entries[entries.indexOf(prior)]=entry;else entries.push(entry);
 registry[row.id]={id:row.id,label:row.label,src:asset,status:'ready',width:384,height:384,assetSha256:digest(bytes)};
 const brief={id:row.id,label:row.label,brief:row.scene,prompt:row.prompt||'Original spring umbrella scene; built-in image generation. Warm mid-century gouache/watercolor, cherry blossoms, one romantic couple sheltering under a coherent umbrella, no snow or Christmas.'};
 const index=briefs.findIndex(e=>e.id===row.id);if(index<0)briefs.push(brief);else briefs[index]=brief;
 aliases[row.label]=row.id;engineAliases[row.label]=row.id;
 if(!shortLabels[row.id])shortLabels[row.id]=row.label;
}
for(const [file,data] of Object.entries({'src/art/illustrations.json':entries,'src/engine/illustrationRegistry.json':registry,'docs/artwork/scene-briefs.json':briefs,'src/art/room-illustration-aliases.json':aliases,'src/engine/roomIllustrationAliases.json':engineAliases,'src/engine/shortLabels.json':shortLabels,'public/illustrations/manifest.json':entries.filter(e=>e.active).map(e=>e.asset)}))await writeFile(file,JSON.stringify(data,null,2)+'\n');
console.log(`Installed ${rows.length} original illustrations; visual review pending.`);
