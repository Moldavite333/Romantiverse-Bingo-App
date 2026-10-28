import test from 'node:test';
import assert from 'node:assert/strict';
import {verifiedPosterForMovie} from '../scripts/verify-live-room.mjs';

const movie={title:'Autumn Example',release_year:2026};
test('live-room poster lookup requires exact title and release year',()=>{
 const feed={movies:[
  {title:'Autumn Example',release_year:2025,poster_url:'https://image.tmdb.org/t/p/w500/wrong.jpg'},
  {title:'Autumn Example',release_year:2026,poster_url:'https://image.tmdb.org/t/p/w500/right.jpg'}
 ]};
 assert.equal(verifiedPosterForMovie(movie,feed),'https://image.tmdb.org/t/p/w500/right.jpg');
});

test('missing or unapproved artwork stays null instead of inventing a poster',()=>{
 assert.equal(verifiedPosterForMovie(movie,{movies:[]}),null);
 assert.equal(verifiedPosterForMovie(movie,{movies:[
  {...movie,poster_url:'https://example.com/private-image.jpg'}
 ]}),null);
 assert.equal(verifiedPosterForMovie(movie,{movies:[
  {...movie,poster_url:null}
 ]}),null);
});
