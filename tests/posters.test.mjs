import test from 'node:test';
import assert from 'node:assert/strict';
import {approvedMoviePoster} from '../src/engine/posters.mjs';
const posterUrl='https://image.tmdb.org/t/p/w500/poster.jpg';
test('trusted TMDB poster paths accept explicit credit and preserve it',()=>{
 const movie={poster_url:posterUrl,poster_rights:{status:'approved',credit:'Image used with permission · TMDB'}};
 assert.deepEqual(approvedMoviePoster(movie),{url:posterUrl,credit:movie.poster_rights.credit});
});
test('catalog-supplied trusted-host posters display with fallback attribution',()=>{
 assert.deepEqual(approvedMoviePoster({poster_url:posterUrl}),{url:posterUrl,credit:'Poster via TMDB · Artwork belongs to its respective rights holders'});
 assert.equal(approvedMoviePoster({poster_url:'https://image.tmdb.org/t/p/original/cover.webp'}).url,'https://image.tmdb.org/t/p/original/cover.webp');
 const commons='https://upload.wikimedia.org/wikipedia/commons/a/ab/poster.png';
 assert.deepEqual(approvedMoviePoster({poster_url:commons}),{url:commons,credit:'Poster via Wikimedia Commons'});
});
test('blank credit falls back and overly long credit is truncated',()=>{
 assert.equal(approvedMoviePoster({poster_url:posterUrl,poster_rights:{credit:'  '}}).credit,'Poster via TMDB · Artwork belongs to its respective rights holders');
 assert.equal(approvedMoviePoster({poster_url:posterUrl,poster_rights:{credit:'x'.repeat(300)}}).credit.length,160);
});
test('reject insecure, credentialed, unknown-host and malformed image URLs',()=>{
 for(const url of ['http://image.tmdb.org/t/p/w500/poster.jpg','https://evil.example/poster.jpg','https://image.tmdb.org.evil.example/t/p/w500/poster.jpg','https://user:password@image.tmdb.org/t/p/w500/poster.jpg','https://image.tmdb.org:444/t/p/w500/poster.jpg','javascript:alert(1)','https://image.tmdb.org/not-a-poster.jpg','https://image.tmdb.org/t/p/bad/poster.jpg','https://image.tmdb.org/t/p/w500/extra/poster.jpg','https://upload.wikimedia.org/wikipedia/en/a/poster.jpg']){
  assert.equal(approvedMoviePoster({poster_url:url}),null,url);
 }
 assert.equal(approvedMoviePoster({poster_url:null}),null);
 assert.equal(approvedMoviePoster(null),null);
});
