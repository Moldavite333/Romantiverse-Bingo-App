import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePublishedPosters,loadPublishedMoviePosters} from '../src/services/publishedPosters.mjs';
import {mergeMovieListings} from '../src/engine/movieListings.mjs';

const art='https://image.tmdb.org/t/p/w500/approved.jpg';
const feed=[{title:'Autumn at Apple Hill',release_year:2024,season:'Fall',poster_url:art,poster_locked:true,published_at:'2026-10-26T10:00:00Z',notes:'PRIVATE',workspace_id:'private-id'}];
test('public HQ feed retains only approved display metadata and ignores private fields',()=>{
 const [movie]=normalizePublishedPosters(feed);
 assert.equal(movie.title,'Autumn at Apple Hill');
 assert.equal(movie.poster_url,art);
 assert.equal(movie.poster_locked,true);
 assert.equal(movie.release_year,2024);
 assert.ok(!('notes' in movie));
 assert.ok(!('workspace_id' in movie));
 assert.ok(!('published_at' in movie));
});
test('HQ-locked poster overrides automated artwork for the same verified movie identity',()=>{
 const base={id:'catalog',title:'Autumn at Apple Hill',release_year:2024,is_demo:false,season:'Fall',poster_url:'https://image.tmdb.org/t/p/w500/automatic.jpg',story_facts:{setting:['orchard']}};
 const [result]=mergeMovieListings([[base],normalizePublishedPosters(feed)]);
 assert.equal(result.poster_url,art);
 assert.equal(result.poster_locked,true);
 assert.equal(result.id,'catalog');
 assert.deepEqual(result.story_facts,base.story_facts);
 assert.equal(base.poster_url,'https://image.tmdb.org/t/p/w500/automatic.jpg');
});
test('unlocked HQ poster never replaces an existing valid poster',()=>{
 const base={title:'Autumn at Apple Hill',release_year:2024,is_demo:false,poster_url:'https://image.tmdb.org/t/p/w500/automatic.jpg'};
 const [result]=mergeMovieListings([[base],normalizePublishedPosters([{...feed[0],poster_locked:false}])]);
 assert.equal(result.poster_url,base.poster_url);
});
test('wrong-year remake and fictional demos never inherit HQ artwork',()=>{
 const remade={title:'Autumn at Apple Hill',release_year:2025,is_demo:false};
 const [remake,original]=mergeMovieListings([[remade],normalizePublishedPosters(feed)]);
 assert.equal(remake.poster_url,undefined);
 assert.equal(original.poster_url,art);
 const demo={title:'Autumn at Apple Hill',release_year:2024,is_demo:true};
 assert.equal(mergeMovieListings([[demo],normalizePublishedPosters(feed)])[0].poster_url,undefined);
});
test('untrusted URLs and invalid records are rejected',()=>{
 const rows=normalizePublishedPosters([{...feed[0],poster_url:'https://bad.example/p.png'},{title:' '},{title:'New',poster_url:'javascript:alert(1)',season:'Horror'}]);
 assert.equal(rows.length,2);
 assert.equal(rows[0].poster_url,null);
 assert.equal(rows[1].poster_url,null);
 assert.equal(rows[1].season,'Unspecified');
 assert.throws(()=>normalizePublishedPosters({movies:[]}),/Invalid/);
});
test('public fetch uses the read-only RPC and requires successful response',async()=>{
 let called='';
 const movies=await loadPublishedMoviePosters({fetcher:async(url,opts)=>{called=url;assert.ok(opts.headers.apikey.startsWith('sb_publishable_'));return {ok:true,json:async()=>feed}}});
 assert.match(called,/\/rpc\/published_movie_posters$/);
 assert.equal(movies.length,1);
 await assert.rejects(loadPublishedMoviePosters({fetcher:async()=>({ok:false,status:503})}),/503/);
});

test('published movie IDs remain stable when HQ publication order changes',()=>{
 const other={title:'Sweet Autumn',release_year:2020,season:'Fall',poster_url:art,poster_locked:false};
 const forward=normalizePublishedPosters([feed[0],other]);
 const reverse=normalizePublishedPosters([other,feed[0]]);
 const ids=items=>Object.fromEntries(items.map(item=>[item.title,item.id]));
 assert.deepEqual(ids(forward),ids(reverse));
});
