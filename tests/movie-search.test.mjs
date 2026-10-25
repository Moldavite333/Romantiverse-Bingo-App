import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeMovieSearchResults,searchPublicMovies} from '../src/services/movieSearch.js';
test('public movie search accepts films but rejects unrelated items',()=>{
 const result=normalizeMovieSearchResults({search:[
  {id:'Q123',label:'Christmas in Town',description:'2024 American television film'},
  {id:'Q124',label:'Christmas in Town',description:'2024 song'},
  {id:'Q125',label:'Autumn Wedding',description:'2019 romantic comedy film'}]});
 assert.equal(result.length,2);assert.equal(result[0].release_year,2024);
 assert.equal(result[0].season,'Christmas');assert.equal(result[1].season,'Fall');
 assert.ok(!JSON.stringify(result).includes('American television film'));
 assert.equal(result[0].verification_status,'search_result_unverified');
});
test('short searches do not make requests',async()=>{
 const result=await searchPublicMovies('ab',{fetcher:()=>{throw Error('must not fetch')}});assert.deepEqual(result,[]);
});
test('search request uses public origin and normalizes metadata',async()=>{
 let url='';const result=await searchPublicMovies('Holiday Inn',{fetcher:async u=>{url=u;return {ok:true,json:async()=>({search:[{id:'Q444',label:'Holiday Inn',description:'1942 film'}]})}}});
 assert.match(url,/origin=%2A/);assert.match(url,/wbsearchentities/);assert.equal(result[0].title,'Holiday Inn');
 assert.equal(result[0].season,'Unspecified');
});

test('public search excludes people, music, TV series and film-industry results',()=>{
 const result=normalizeMovieSearchResults({search:[
  {id:'Q201',label:'A Christmas Wedding',description:'2024 American television film'},
  {id:'Q202',label:'Christmas Singer',description:'American film actor and singer'},
  {id:'Q203',label:'Christmas Hits',description:'2024 Christmas album'},
  {id:'Q204',label:'A Christmas Story',description:'2024 television series'},
  {id:'Q205',label:'Holiday Pictures',description:'American film studio'},
  {id:'Q206',label:'The Film Festival',description:'annual film festival'},
  {id:'Q207',label:'Christmas Single',description:'2024 Christmas song'},
  {id:'Q208',label:'Christmas Soundtrack',description:'film soundtrack'},
  {id:'Q209',label:'Autumn Romance',description:'2023 romantic comedy film based on a novel'},
  {id:'Q210',label:'Christmas Director',description:'American movie director'}
 ]});
 assert.deepEqual(result.map(x=>x.id),['wikidata-Q201','wikidata-Q209']);
 assert.equal(result[1].season,'Fall');
});
test('public search ignores repeated IDs, empty and oversized titles',()=>{
 const result=normalizeMovieSearchResults({search:[
  {id:'Q300',label:'First Film',description:'2021 film'},
  {id:'Q300',label:'Duplicate Film',description:'2021 film'},
  {id:'Q301',label:'  ',description:'2021 film'},
  {id:'Q302',label:'X'.repeat(251),description:'2021 film'},
  {id:'Q303',label:' Second Film ',description:'2022 film'}
 ]});
 assert.deepEqual(result.map(x=>x.title),['First Film','Second Film']);
});

test('search keeps neutral movie titles without mislabeling them Christmas',()=>{
 const result=normalizeMovieSearchResults({search:[
  {id:'Q501',label:'The Winter Wedding',description:'2025 television film'},
  {id:'Q502',label:'A Holiday Abroad',description:'2024 romantic comedy film'},
  {id:'Q503',label:'Love at First Sight',description:'2023 film'},
  {id:'Q504',label:'Christmas Harvest',description:'2022 film'},
  {id:'Q505',label:'The Pumpkin Promise',description:'2021 film'}
 ]});
 assert.deepEqual(result.map(m=>m.season),['Unspecified','Unspecified','Unspecified','Unspecified','Fall']);
 assert.equal(result.length,5,'Neutral titles remain discoverable');
});
