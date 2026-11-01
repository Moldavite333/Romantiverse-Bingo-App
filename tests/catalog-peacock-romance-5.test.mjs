import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateStaticMovies} from '../src/services/staticCatalog.js';

const catalog=JSON.parse(readFileSync(new URL('../public/catalog/movies.json',import.meta.url),'utf8'));
const evidence=[
 ['A Christmas Arrangement',2018,'https://www.peacocktv.com/watch-online/movies/a-christmas-arrangement/ab1e7581-bd47-3650-b018-4b7fd097ee59'],
 ['A Christmas Princess',2019,'https://www.peacocktv.com/watch-online/movies/romance/a-christmas-princess/c7704ca5-d54c-3938-a05b-26a52a6c53e5'],
 ['A Christmas Vintage',2023,'https://www.peacocktv.com/watch-online/movies/a-christmas-vintage/321d10d9-3920-3869-8e36-dfac9207da6e'],
 ['A Royal Christmas Ball',2017,'https://www.peacocktv.com/watch-online/movies/a-royal-christmas-ball/94d4aed6-9a1f-3623-9078-33916a992ca6'],
 ['A Very English Christmas',2023,'https://www.peacocktv.com/watch-online/movies/a-very-english-christmas/f934cb43-af4a-357e-bbfe-e26ed8d319f8']
];

test('five Peacock-listed Christmas romances expand public discovery without duplicate titles',()=>{
 assert.ok(catalog.movies.length>=126);
 assert.ok(catalog.movies.filter(m=>m.verification_status==='metadata_verified').length>=106);
 assert.equal(catalog.movies.filter(m=>m.verification_status==='unverified').length,20,'Keep mystery titles pending relevance review');
 for(const [title,year,url] of evidence){
  const matches=catalog.movies.filter(m=>m.title===title&&m.release_year===year);
  assert.equal(matches.length,1,title+' should appear exactly once');
  const m=matches[0];
  assert.equal(m.season,'Christmas');
  assert.equal(m.source_name,'Peacock official movie page');
  assert.equal(m.source_url,url);
  assert.equal(m.verification_status,'metadata_verified');
  assert.equal(m.facts_status,'title_only_unverified');
  assert.equal(m.is_demo,false);
  assert.deepEqual(m.story_facts,{setting:[],relationship:[],conflict:[],event:[]});
  assert.equal(Object.hasOwn(m,'network'),false,'A streaming listing is not evidence of the original broadcaster');
  for(const field of ['synopsis','description','poster_url','notes','private_notes','hq_notes']){
   assert.equal(Object.hasOwn(m,field),false,'No invented or private '+field);
  }
 }
 assert.equal(catalog.movies.find(m=>m.title==='A Very English Christmas').production_company,'Reel One Entertainment');
 for(const [title] of evidence.filter(([title])=>title!=='A Very English Christmas')){
  assert.equal(Object.hasOwn(catalog.movies.find(m=>m.title===title),'production_company'),false,'Do not infer producer from streaming distributor');
 }
});

test('new titles remain playable as title-only cards without asserting observed scenes',()=>{
 const movies=validateStaticMovies(catalog);
 for(const [title,year] of evidence){
  const m=movies.find(x=>x.title===title&&x.release_year===year);
  assert.ok(m,title);
  assert.equal(m.verification_status,'metadata_verified');
  assert.notEqual(m.facts_status,'scene_verified');
 }
});
