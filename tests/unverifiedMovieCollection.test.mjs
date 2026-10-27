import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMovieSearchResults} from '../src/services/movieSearch.js';

test('public movie search never invents a verified collection from a seasonal title',()=>{
 const movies=normalizeMovieSearchResults({search:[
  {id:'Q12345',label:'Christmas at Pine Ridge',description:'2024 television film'},
  {id:'Q12346',label:'Autumn in the Valley',description:'2023 romance film'},
  {id:'Q12347',label:'A Summer Promise',description:'2021 drama film'}
 ]});
 assert.equal(movies.length,3);
 for(const movie of movies){
  assert.equal(movie.season,'Unspecified');
  assert.equal(movie.verification_status,'search_result_unverified');
 }
});
