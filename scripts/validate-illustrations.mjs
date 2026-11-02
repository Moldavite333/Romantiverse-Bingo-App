import {readFile,stat} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import {CHEESE,SEASONAL} from '../src/engine/intelligence.mjs';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import roomAliases from '../src/engine/roomIllustrationAliases.json' with {type:'json'};
export function roomTropeLabels(){
 const source=readFileSync(new URL('../supabase/functions/game-room/index.ts',import.meta.url),'utf8');
 const cheese=vm.runInNewContext(source.match(/const cheese=(\[[^;]+);/)[1]);
 const themes=vm.runInNewContext('('+source.match(/const themes=(\{[^;]+);/)[1]+')');
 return [...new Set([...cheese,...Object.values(themes).flat()])];
}
export function canonicalTropes(){
 const rows=[...CHEESE.map(t=>({id:t.id,label:t.label})),...Object.entries(SEASONAL).flatMap(([season,labels])=>labels.map((label,i)=>({id:`season-${season}-${i}`,label}))),{id:'free',label:'CHEESE LOUISE POD'}],seen=new Set(rows.map(r=>r.id));
 for(const label of roomTropeLabels()){
  const id=roomAliases[label];
  if(!id)throw Error('Unregistered multiplayer label: '+label);
  if(!seen.has(id)){rows.push({id,label});seen.add(id)}
 }
 return rows;
}
export function differenceHash(pixels){let bits=0n;for(let y=0;y<8;y++)for(let x=0;x<8;x++)bits=(bits<<1n)|BigInt(pixels[y*9+x]>pixels[y*9+x+1]);return bits}
export function hashDistance(a,b){let n=a^b,count=0;while(n){count++;n&=n-1n}return count}
export async function auditIllustrations({root=resolve('.'),registry,requireReady=true}={}){
 registry??=JSON.parse(await readFile(resolve(root,'src/engine/illustrationRegistry.json'),'utf8'));
 const errors=[],warnings=[],files=[],refs=new Map(),digests=new Map(),canonical=canonicalTropes();
 const briefs=JSON.parse(await readFile(resolve(root,'docs/artwork/scene-briefs.json'),'utf8'));
 const publicRoot=resolve(root,'public');
 for(const trope of canonical){
  const row=registry[trope.id];
  if(!row){errors.push(`Missing assignment: ${trope.id}`);continue}
  if(row.id!==trope.id||row.label!==trope.label)errors.push(`Incorrect association: ${trope.id}`);
  const brief=briefs.find(b=>b.id===trope.id);
  if(!brief?.brief||!brief?.prompt||brief.label!==trope.label)errors.push(`Missing or incorrect scene brief: ${trope.id}`);
  if(row.status!=='ready'){if(requireReady)errors.push(`Unfinished illustration: ${trope.id}`);continue}
  if(!/^illustrations\/[a-zA-Z0-9-]+\.webp$/.test(row.src||'')){errors.push(`Invalid image path: ${trope.id}`);continue}
  const file=resolve(publicRoot,row.src);
  if(!file.startsWith(publicRoot+sep)){errors.push(`Outside public directory: ${trope.id}`);continue}
  if(refs.has(row.src))errors.push(`Duplicate reference: ${trope.id} and ${refs.get(row.src)}`);refs.set(row.src,trope.id);
  try{
   const info=await stat(file),bytes=await readFile(file),meta=await sharp(bytes).metadata();
   if(info.size>90000)errors.push(`Oversize image (${info.size} bytes): ${trope.id}`);
   if(meta.format!=='webp'||meta.width!==384||meta.height!==384)errors.push(`Expected 384×384 WebP: ${trope.id}`);
   const digest=createHash('sha256').update(bytes).digest('hex');
   if(digests.has(digest))errors.push(`Duplicate artwork content: ${trope.id} and ${digests.get(digest)}`);digests.set(digest,trope.id);
   const pixels=await sharp(bytes).resize(9,8,{fit:'fill'}).greyscale().raw().toBuffer();
   files.push({id:trope.id,bytes:info.size,hash:differenceHash(pixels)});
  }catch(e){errors.push(`Broken image: ${trope.id}: ${e.message}`)}
 }
 for(const id of Object.keys(registry))if(!canonical.some(t=>t.id===id))errors.push(`Unknown registry ID: ${id}`);
 for(let i=0;i<files.length;i++)for(let j=0;j<i;j++){
  const distance=hashDistance(files[i].hash,files[j].hash);
  if(distance<=5)errors.push(`Near-identical image candidate (dHash ${distance}): ${files[i].id} and ${files[j].id}`);
  else if(distance<=10)warnings.push(`Visual similarity review (dHash ${distance}): ${files[i].id} and ${files[j].id}`);
 }
 return {canonicalTropes:canonical.length-1,brandedCenters:1,ready:files.length,unfinished:canonical.length-files.length,totalBytes:files.reduce((n,f)=>n+f.bytes,0),errors,warnings};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const report=await auditIllustrations();console.log(JSON.stringify(report,null,2));if(report.errors.length)process.exitCode=1}
