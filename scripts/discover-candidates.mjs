// Manual or scheduled research only; writes artifacts, never the playable catalog.
import fs from 'node:fs';
import {discoverWikidata} from './sources/wikidata.mjs';
const leads=await discoverWikidata();
fs.mkdirSync('research',{recursive:true});
const file='research/wikidata-candidates.json';
fs.writeFileSync(file,JSON.stringify({generated_at:new Date().toISOString(),source:'Wikidata Query Service',disclaimer:'Candidate leads only. No plot descriptions or Hallmark affiliation confirmed. Human review required.',candidates:leads},null,2)+'\n');
console.log('Saved '+leads.length+' candidate film records. Published catalog unchanged.');
