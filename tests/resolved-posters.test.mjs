import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeResolvedPosters,loadResolvedPosters} from '../src/services/resolvedPosters.mjs';
import {mergeMovieListings} from '../src/engine/movieListings.mjs';
const auto='https://image.tmdb.org/t/p/w780/resolved.jpg';
const locked='https://image.tmdb.org/t/p/w780/hq.jpg';
const payload={version:1,movies:[{title:'Autumn at Apple Hill',release_year:2024,poster_url:auto,poster_source:'tmdb',match_score:75,private_notes:'SECRET',workspace_id:'PRIVATE'}]};

test('verified poster cache exposes only title/year/approved image metadata',()=>{
 const [movie]=normalizeResolvedPosters(payload);
 assert.equal(movie.poster_url,auto);
 assert.equal(movie.release_year,2024);
 assert.equal(movie.poster_source,'catalog_public');
 assert.equal(movie.is_demo,false);
 assert.equal('private_notes' in movie,false);
 assert.equal('workspace_id' in movie,false);
 assert.equal('match_score' in movie,false);
});
test('cache fills bundled titles without changing the title, season or story facts',()=>{
 const staticMovie={id:'static',title:'Autumn at Apple Hill',release_year:2024,season:'Fall',is_demo:false,story_facts:{setting:['orchard']}};
 const [movie]=mergeMovieListings([[staticMovie],normalizeResolvedPosters(payload)]);
 assert.equal(movie.id,'static');
 assert.equal(movie.poster_url,auto);
 assert.equal(movie.season,'Fall');
 assert.deepEqual(movie.story_facts,staticMovie.story_facts);
});
test('HQ locked poster still wins after automatic cache enrichment',()=>{
 const staticMovie={id:'static',title:'Autumn at Apple Hill',release_year:2024,is_demo:false};
 const hq={id:'hq',title:'Autumn at Apple Hill',release_year:2024,is_demo:false,poster_url:locked,poster_source:'hq_published',poster_locked:true};
 const [movie]=mergeMovieListings([[staticMovie],normalizeResolvedPosters(payload),[hq]]);
 assert.equal(movie.poster_url,locked);
 assert.equal(movie.poster_locked,true);
});
test('wrong-year remakes and demos do not inherit cached artwork',()=>{
 const wrong={id:'wrong',title:'Autumn at Apple Hill',release_year:2025,is_demo:false};
 const demo={id:'demo',title:'Autumn at Apple Hill',release_year:2024,is_demo:true};
 assert.equal(mergeMovieListings([[wrong],normalizeResolvedPosters(payload)])[0].poster_url,undefined);
 assert.equal(mergeMovieListings([[demo],normalizeResolvedPosters(payload)])[0].poster_url,undefined);
});
test('rejects malicious hosts, invalid years, duplicates, and unexpected response format',()=>{
 const rows=normalizeResolvedPosters({version:1,movies:[...payload.movies,{...payload.movies[0],poster_url:'https://evil.example/a.jpg'},{...payload.movies[0],release_year:2200},{...payload.movies[0]}]});
 assert.equal(rows.length,1);
 assert.throws(()=>normalizeResolvedPosters({version:2,movies:[]}),/Invalid/);
 assert.throws(()=>normalizeResolvedPosters({version:1,movies:{}}),/Invalid/);
});
test('poster feed uses only public GET and returns meaningful errors',async()=>{
 let url='',opts;
 const rows=await loadResolvedPosters({fetcher:async(u,o)=>{url=u;opts=o;return {ok:true,json:async()=>payload}}});
 assert.match(url,/\/functions\/v1\/bingo-public-posters$/);
 assert.equal(opts.method,'GET');
 assert.equal('Authorization' in opts.headers,false);
 assert.equal(rows.length,1);
 await assert.rejects(loadResolvedPosters({fetcher:async()=>({ok:false,status:503})}),/503/);
});
