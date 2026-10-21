// One-time migration: remove descriptions and store controlled-vocabulary story facts.
// Does not crawl sources or make external requests.
import fs from 'node:fs';
import {extractStoryFacts} from '../src/engine/storyFacts.mjs';
const path='public/catalog/movies.json';
const catalog=JSON.parse(fs.readFileSync(path,'utf8'));
catalog.movies=catalog.movies.map(({synopsis,description, ...movie})=>({
 ...movie,story_facts:movie.story_facts||extractStoryFacts(synopsis||description||''),
 facts_status:'machine_inferred_unverified'
}));
catalog.updated_at=new Date().toISOString().slice(0,10);
catalog.data_policy='No third-party synopsis text stored. Story facts are original controlled-vocabulary tags; movie titles and release years identify works.';
fs.writeFileSync(path,JSON.stringify(catalog,null,2)+'\n');
console.log('Migrated '+catalog.movies.length+' records to tags-only metadata.');
