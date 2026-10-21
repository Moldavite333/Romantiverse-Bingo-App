// Imports editorially approved JSON metadata only. Never crawls a website.
import fs from 'node:fs';
const input=process.argv[2];
if(!input)throw Error('Usage: node scripts/merge-catalog.mjs path/to/approved-movies.json');
const path='public/catalog/movies.json';
const base=JSON.parse(fs.readFileSync(path,'utf8'));
const incoming=JSON.parse(fs.readFileSync(input,'utf8'));
if(!Array.isArray(incoming.movies)||!incoming.source||!incoming.permission_note)throw Error('Import requires movies[], source and permission_note documenting permitted reuse.');
const byId=new Map(base.movies.map(m=>[m.id,m]));
for(const m of incoming.movies){if(!m.id||!m.title||!m.season||typeof m.synopsis!=='string')throw Error('Invalid incoming movie');byId.set(m.id,{...m,verification_status:m.verification_status||'unverified',is_demo:false})}
base.movies=[...byId.values()].sort((a,b)=>a.title.localeCompare(b.title));
base.updated_at=new Date().toISOString().slice(0,10);
base.source='Curated catalog; latest approved import: '+incoming.source+'. '+incoming.permission_note;
fs.writeFileSync(path,JSON.stringify(base,null,2)+'\n');
console.log('Merged '+incoming.movies.length+' approved movies; total '+base.movies.length);
