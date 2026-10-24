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
});
