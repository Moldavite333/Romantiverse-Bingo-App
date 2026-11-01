import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateStaticMovies} from '../src/services/staticCatalog.js';

const catalog=JSON.parse(readFileSync(new URL('../public/catalog/movies.json',import.meta.url),'utf8'));
const evidence=[
  ['A Christmas Wedding Tail',2011,'Hallmark Channel',
   'Anchor Bay 2011 Hallmark premiere announcement',
   'https://www.newswire.com/news/jingle-bells-meet-wedding-bells-in-debut-original-family-film-a-christmas-91419',
   ['wedding','christmas']],
  ['The Wishing Well',2010,'Hallmark Channel',
   'TheTVDB US premiere and network record',
   'https://www.thetvdb.com/movies/the-wishing-well',[]]
];

test('two classic romance titles have independently sourced identity, US premiere year and network',()=>{
 assert.equal(catalog.movies.length,121,'No catalog titles added or removed');
 assert.equal(catalog.movies.filter(m=>m.verification_status==='metadata_verified').length,101);
 assert.equal(catalog.movies.filter(m=>m.verification_status==='unverified').length,20);
 for(const [title,year,network,source_name,source_url,events] of evidence){
  const matches=catalog.movies.filter(m=>m.title===title&&m.release_year===year);
  assert.equal(matches.length,1,title+' must be unique');
  const movie=matches[0];
  assert.equal(movie.network,network);
  assert.equal(movie.source_name,source_name);
  assert.equal(movie.source_url,source_url);
  assert.equal(movie.verification_status,'metadata_verified');
  assert.equal(movie.facts_status,'title_only_unverified');
  assert.deepEqual(movie.story_facts,{setting:[],relationship:[],conflict:[],event:events});
  for(const field of ['synopsis','description','poster_url','production_company','notes','private_notes','hq_notes']){
   assert.equal(Object.hasOwn(movie,field),false,'Do not invent or leak '+field);
  }
 }
});

test('verified movie metadata does not assert that scenes or tropes were watched',()=>{
 const movies=validateStaticMovies(catalog);
 for(const [title,year] of evidence){
  const movie=movies.find(m=>m.title===title&&m.release_year===year);
  assert.ok(movie);
  assert.equal(movie.verification_status,'metadata_verified');
  assert.notEqual(movie.facts_status,'scene_verified');
 }
 // Preserve mystery titles without falsely verifying their romance relevance.
 const unverified=catalog.movies.filter(m=>m.verification_status==='unverified');
 assert.ok(unverified.some(m=>m.title.includes('Mysteries')));
});
