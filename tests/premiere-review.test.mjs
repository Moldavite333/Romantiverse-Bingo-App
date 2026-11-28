import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildPremiereReview} from '../scripts/sources/premiere-review.mjs';
const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const listings=read('../scripts/sources/verified-premieres.json');
const catalog=read('../public/catalog/movies.json');

test('reviews sourced premieres in broadcast order and keeps streaming access distinct',()=>{
 const result=buildPremiereReview(listings,catalog,{from:'2026-11-28',days:9});
 assert.equal(result.rows.find(movie=>movie.title==='Return to Santa').catalog_status,'already_cataloged');
 assert.equal(result.rows.find(movie=>movie.title==='Return to Santa').next_day_availability.date,'2026-11-28');
 assert.equal(result.rows.find(movie=>movie.title==='Checking Inn for Christmas').catalog_status,'new_candidate');
 assert.match(result.rows.find(movie=>movie.title==='Checking Inn for Christmas').next_day_availability.access,/TV provider/);
 assert.equal(result.rows.find(movie=>movie.title==='A Grand Biltmore Christmas').next_day_availability,null);
 assert.deepEqual(result.rows.map(movie=>Date.parse(movie.premiere_at)),result.rows.map(movie=>Date.parse(movie.premiere_at)).sort((a,b)=>a-b));
});

test('rejects duplicate evidence and unsigned local broadcast times',()=>{
 const sample={...listings,premieres:[listings.premieres[0],{...listings.premieres[0],title:'return to santa'}]};
 assert.throws(()=>buildPremiereReview(sample,catalog),/Duplicate premiere/);
 assert.throws(()=>buildPremiereReview({...sample,premieres:[{...sample.premieres[0],at:'2026-11-27T20:00:00'}]},catalog),/Invalid premiere/);
});
