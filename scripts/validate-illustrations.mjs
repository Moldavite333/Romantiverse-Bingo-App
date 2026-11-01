import {readFileSync,existsSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {illustrationRegistry} from '../src/engine/illustrationRegistry.mjs';
const required=Object.values(illustrationRegistry);
const issues=[],paths=new Map(),hashes=new Map();
for(const t of required){
 const e=illustrationRegistry[t.id];
 if(!e?.asset){issues.push(`${t.id}: missing assignment`);continue;}
 if(e.label!==t.label)issues.push(`${t.id}: incorrect label association`);
 if(e.asset!==`illustrations/${t.id}.webp`)issues.push(`${t.id}: incorrect canonical asset association`);
 if(!e.scene)issues.push(`${t.id}: missing scene brief`);
 if(paths.has(e.asset))issues.push(`${t.id}: shares asset with ${paths.get(e.asset)}`);
 paths.set(e.asset,t.id);
 if(!/^illustrations\/[a-zA-Z0-9-]+\.webp$/.test(e.asset)){issues.push(`${t.id}: unsafe asset path`);continue;}
 const file='public/'+e.asset;
 if(!existsSync(file)){issues.push(`${t.id}: broken path ${file}`);continue;}
 if(statSync(file).size>80000)issues.push(`${t.id}: exceeds 80KB budget`);
 const bytes=readFileSync(file),hash=createHash('sha256').update(bytes).digest('hex');
 if(e.assetSha256!==hash)issues.push(`${t.id}: asset changed since provenance/review capture`);
 if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')issues.push(`${t.id}: invalid WebP`);
 if(hashes.has(hash))issues.push(`${t.id}: identical content to ${hashes.get(hash)}`);
 hashes.set(hash,t.id);
 if(!e.reviewed)issues.push(`${t.id}: visual review pending`);
}
console.log(JSON.stringify({required:required.length,uniqueAssets:hashes.size,issues},null,2));
if(issues.length)process.exitCode=1;
