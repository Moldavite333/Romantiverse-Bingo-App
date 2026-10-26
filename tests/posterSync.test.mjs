import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeMovieListings} from '../src/engine/movieListings.mjs';
import {orderMoviesForBrowsing} from '../src/engine/posterOrdering.mjs';
import {normalizePublishedPosters} from '../src/services/publishedPosters.mjs';

const automatic='https://image.tmdb.org/t/p/w500/automatic.jpg';
const locked='https://image.tmdb.org/t/p/w780/editorial.jpg';
const base={id:'catalog',title:'Sweet Autumn',release_year:2020,is_demo:false,poster_source:'catalog_public',poster_url:automatic};
const hq={id:'hq',title:'Sweet Autumn',release_year:2020,is_demo:false,poster_source:'hq_published',poster_url:locked,poster_locked:true};

test('HQ-locked published poster overrides automatic artwork for an exact title and year',()=>{
 const [movie]=mergeMovieListings([[base],[hq]]);
 assert.equal(movie.id,'catalog');
 assert.equal(movie.poster_url,locked);
 assert.equal(movie.poster_locked,true);
});

test('HQ-locked poster remains authoritative regardless of catalog ordering',()=>{
 const [movie]=mergeMovieListings([[hq],[base]]);
 assert.equal(movie.poster_url,locked);
 assert.equal(movie.poster_locked,true);
});

test('unlocked HQ poster does not replace an already selected automatic poster',()=>{
 const [movie]=mergeMovieListings([[base],[{...hq,poster_locked:false}]]);
 assert.equal(movie.poster_url,automatic);
});

test('published HQ poster enriches an otherwise posterless matching movie',()=>{
 const [movie]=mergeMovieListings([[{...base,poster_url:null}],[{...hq,poster_locked:false}]]);
 assert.equal(movie.poster_url,locked);
});

test('different release years and demo titles cannot inherit unrelated HQ artwork',()=>{
 const different=mergeMovieListings([[base],[{...hq,release_year:2021}]]);
 assert.equal(different.length,2);
 assert.equal(different[0].poster_url,automatic);
 const [demo]=mergeMovieListings([[{...base,poster_url:null,is_demo:true}],[hq]]);
 assert.equal(demo.poster_url,null);
});

test('unapproved image hosts cannot enrich public catalog movies',()=>{
 const [movie]=mergeMovieListings([[{...base,poster_url:null}],[{...hq,poster_url:'https://example.org/private.png'}]]);
 assert.equal(movie.poster_url,null);
});

test('public HQ normalization exposes only published poster metadata, not private workspace fields',()=>{
 const [movie]=normalizePublishedPosters([{title:'Sweet Autumn',release_year:2020,season:'Fall',poster_url:locked,poster_locked:true,private_notes:'NEVER PUBLIC',customer_email:'private@example.org'}]);
 assert.equal(movie.poster_url,locked);
 assert.equal(movie.poster_locked,true);
 assert.equal('private_notes' in movie,false);
 assert.equal('customer_email' in movie,false);
});

test('default browsing displays real posters before placeholders, without altering search relevance',()=>{
 const missing={id:'missing',title:'Missing',poster_url:null};
 const poster={id:'poster',title:'Poster',poster_url:locked};
 const input=[missing,poster,{id:'missing2',title:'Missing 2',poster_url:null}];
 assert.deepEqual(orderMoviesForBrowsing(input).map(m=>m.id),['poster','missing','missing2']);
 assert.equal(orderMoviesForBrowsing(input,'Sweet'),input);
});
