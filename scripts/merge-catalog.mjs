// Import source descriptions transiently; store only original controlled-vocabulary tags.
import fs from 'node:fs';
import {extractStoryFacts,validateStoryFacts} from '../src/engine/storyFacts.mjs';
const input=process.argv[2];if(!input)throw Error('Usage: node scripts/merge-catalog.mjs approved.json');
const path='public/catalog/movies.json';
const base=JSON.parse(fs.readFileSync(path,'utf8'));
const incoming=JSON.parse(fs.readFileSync(input,'utf8'));
if(!Array.isArray(incoming.movies)||!incoming.source||!incoming.access_basis)throw Error('Source, access_basis and movies[] required');
const byId=new Map(base.movies.map(m=>[m.id,m]));
for(const m of incoming.movies){
 if(!m.id||!m.title||!['Christmas','Fall','Horror'].includes(m.season))throw Error('Invalid incoming movie');
 const {synopsis,description,story_facts,...safe}=m;
 const facts=story_facts?validateStoryFacts(story_facts):extractStoryFacts(synopsis||description||'');
 byId.set(m.id,{...safe,story_facts:facts,facts_status:'machine_inferred_unverified',verification_status:'unverified',is_demo:false,source_name:incoming.source});
}
base.movies=[...byId.values()].sort((a,b)=>a.title.localeCompare(b.title));
base.updated_at=new Date().toISOString().slice(0,10);
base.source='Editorial metadata; original story-fact tags only';
fs.writeFileSync(path,JSON.stringify(base,null,2)+'\n');
console.log('Merged '+incoming.movies.length+' movies; original source descriptions discarded.');
