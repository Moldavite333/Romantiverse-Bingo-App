// Optional manual research only. Does not change the published catalog.
import fs from 'node:fs';
import {lookupTVmaze,reviewCandidate} from './sources/tvmaze.mjs';
const query=process.argv.slice(2).join(' ').trim();
if(!query)throw Error('Usage: node scripts/research-tvmaze.mjs "movie or series title"');
const results=(await lookupTVmaze(query)).map(x=>reviewCandidate(x,{expectedTitle:query}));
fs.mkdirSync('research',{recursive:true});
const filename='research/tvmaze-'+query.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,60)+'.json';
fs.writeFileSync(filename,JSON.stringify({query,generated_at:new Date().toISOString(),warning:'Research leads only; never automatically publish TVmaze records as Hallmark movies.',results},null,2)+'\n');
console.log('Wrote '+results.length+' research candidates to '+filename+'. No catalog changes.');
