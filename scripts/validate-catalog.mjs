import fs from 'node:fs';
import {validateStoryFacts} from '../src/engine/storyFacts.mjs';
const file=process.argv[2]||'public/catalog/movies.json';
const data=JSON.parse(fs.readFileSync(file,'utf8'));
if(data.version!==1||!Array.isArray(data.movies))throw Error('Expected catalog v1 movies array');
const ids=new Set(),titles=new Set();
for(const [i,m] of data.movies.entries()){
 if(!m||typeof m!=='object')throw Error('Movie '+i+' must be an object');
 // Match the native Android MovieCatalog ID contract before publishing.
 if(typeof m.id!=='string'||!/^[a-z0-9][a-z0-9-]{0,119}$/.test(m.id)||ids.has(m.id))throw Error('Invalid or duplicate native-compatible ID '+i);
 ids.add(m.id);
 if(typeof m.title!=='string'||!m.title.trim()||m.title.length>250)throw Error('Invalid title '+i);
 if(!['Christmas','Fall','Horror','Unspecified'].includes(m.season))throw Error('Invalid season '+i);
 if('synopsis' in m||'description' in m)throw Error('Do not store source synopsis prose '+i);
 if(!m.story_facts)throw Error('Missing controlled story facts '+i);
 validateStoryFacts(m.story_facts);
 if(!['unverified','metadata_verified','scene_verified'].includes(m.verification_status))throw Error('Invalid verification status '+i);
 const key=m.title.toLowerCase().trim()+'|'+(m.release_year??'');
 if(titles.has(key))throw Error('Duplicate title/year '+key);
 titles.add(key);
 if(m.poster_url&&!/^https:\/\//.test(m.poster_url))throw Error('Poster URL must use HTTPS '+i);
}
console.log('Validated '+data.movies.length+' movies; no duplicate titles/IDs.');
