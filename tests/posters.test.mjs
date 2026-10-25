import test from 'node:test';
import assert from 'node:assert/strict';
import {approvedMoviePoster} from '../src/engine/posters.mjs';
const approved={poster_url:'https://image.tmdb.org/t/p/w500/poster.jpg',poster_rights:{status:'approved',credit:'Image used with permission · TMDB'}};
test('explicitly approved poster URLs and visible credit are accepted',()=>{
 assert.deepEqual(approvedMoviePoster(approved),{url:approved.poster_url,credit:approved.poster_rights.credit});
 assert.equal(approvedMoviePoster({...approved,poster_url:'https://upload.wikimedia.org/wikipedia/commons/a/ab/poster.png'}).url,'https://upload.wikimedia.org/wikipedia/commons/a/ab/poster.png');
});
test('an image URL or API source is not evidence of reuse permission',()=>{
 assert.equal(approvedMoviePoster({poster_url:approved.poster_url}),null);
 assert.equal(approvedMoviePoster({...approved,poster_rights:{status:'unverified',credit:'TMDB'}}),null);
 assert.equal(approvedMoviePoster({...approved,poster_rights:{status:'approved',credit:'  '}}),null);
});
test('reject insecure, credentialed, unknown-host and malformed image URLs',()=>{
 for(const url of ['http://image.tmdb.org/t/p/w500/poster.jpg','https://evil.example/poster.jpg','https://image.tmdb.org.evil.example/t/p/w500/poster.jpg','https://user:password@image.tmdb.org/t/p/w500/poster.jpg','https://image.tmdb.org:444/t/p/w500/poster.jpg','javascript:alert(1)','https://image.tmdb.org/not-a-poster.jpg','https://upload.wikimedia.org/wikipedia/en/a/poster.jpg']){
  assert.equal(approvedMoviePoster({...approved,poster_url:url}),null,url);
 }
});
