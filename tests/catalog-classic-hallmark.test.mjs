import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateStaticMovies} from '../src/services/staticCatalog.js';

const catalog=JSON.parse(readFileSync(new URL('../public/catalog/movies.json',import.meta.url),'utf8'));
const verified=[
 ['Christmas in Evergreen',2017,'Hallmark Channel','https://www.hallmarkchannel.com/christmas-in-evergreen-movies/about-the-movies'],
 ['The Nine Lives of Christmas',2014,'Hallmark Channel','https://www.hallmarkchannel.com/hallmark-plus/the-classic-christmas-movie-collection-on-hallmark/'],
 ['Christmas at the Plaza',2019,'Hallmark Channel','https://www.hallmarkchannel.com/christmas-at-the-plaza'],
 ['The Christmas House',2020,'Hallmark Channel','https://www.hallmarkchannel.com/the-christmas-house'],
 ['Three Wise Men and a Baby',2022,'Hallmark Channel','https://www.hallmarkchannel.com/three-wise-men-and-a-baby'],
 ['The Mistletoe Promise',2016,'Hallmark Channel','https://www.hallmarkchannel.com/the-mistletoe-promise'],
 ['The Christmas Train',2017,'Hallmark Channel','https://www.hallmarkchannel.com/christmas/2017-holiday-movies-preview/'],
 ['The Most Wonderful Time of the Year',2008,'Hallmark Channel','https://www.hallmarkchannel.com/christmas/25-top-christmas-movies/'],
 ['The Christmas Secret',2014,'Hallmark Mystery','https://www.hallmarkmystery.com/the-christmas-secret'],
 ['The Christmas Ornament',2013,'Hallmark Channel','https://www.hallmarkchannel.com/home-and-family/today-on-home-family-thursday-november-14th-2013'],
 ['A Very Merry Mix-Up',2013,'Hallmark Channel','https://www.hallmarkchannel.com/a-very-merry-mix-up']
];

test('11 classic movies retain stable identities and source-verified network/year metadata',()=>{
 assert.ok(catalog.movies.length>=121,'Previously verified titles must remain in the expanding catalog');
 assert.ok(catalog.movies.filter(m=>m.verification_status==='metadata_verified').length>=55);
 for(const [title,year,network,url] of verified){
  const matches=catalog.movies.filter(m=>m.title===title&&m.release_year===year);
  assert.equal(matches.length,1,title);
  const [movie]=matches;
  assert.equal(movie.network,network,title);
  assert.equal(movie.source_url,url,title);
  assert.equal(movie.source_name,network+' official title/year reference',title);
  assert.equal(movie.verification_status,'metadata_verified',title);
  assert.equal(movie.is_demo,false,title);
  assert.ok(['title_only_unverified','machine_inferred_unverified'].includes(movie.facts_status),title);
  assert.equal(movie.season,'Christmas',title);
  for(const field of ['synopsis','description','poster_url','poster_rights','production_company']){
   assert.equal(Object.hasOwn(movie,field),false,title+' must not invent '+field);
  }
 }
});

test('source-verified metadata survives public loader without upgrading unobserved scenes',()=>{
 const loaded=validateStaticMovies(catalog);
 for(const [title,year] of verified){
  const movie=loaded.find(m=>m.title===title&&m.release_year===year);
  assert.ok(movie,title);
  assert.equal(movie.verification_status,'metadata_verified',title);
  assert.notEqual(movie.facts_status,'scene_verified',title);
 }
});
