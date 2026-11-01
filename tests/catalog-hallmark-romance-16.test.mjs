import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateStaticMovies} from '../src/services/staticCatalog.js';

const catalog=JSON.parse(readFileSync(new URL('../public/catalog/movies.json',import.meta.url),'utf8'));
const references=[
  [
    "A Christmas Carousel",
    2020,
    "https://www.hallmarkchannel.com/christmas/new-years-eve-marathon-movies-a-christmas-carousel"
  ],
  [
    "A Harvest Wedding",
    2017,
    "https://www.hallmarkchannel.com/fall-into-love/2017-fall-harvest-originals"
  ],
  [
    "Autumn Dreams",
    2015,
    "https://www.hallmarkchannel.com/fall-harvest/all-new-originals"
  ],
  [
    "Christmas by Starlight",
    2020,
    "https://www.hallmarkchannel.com/christmas-by-starlight"
  ],
  [
    "Christmas Getaway",
    2017,
    "https://www.hallmarkchannel.com/christmas-getaway"
  ],
  [
    "Christmas with the Darlings",
    2020,
    "https://www.hallmarkchannel.com/home-and-family/wednesday-november-4th-2020"
  ],
  [
    "Falling for Vermont",
    2017,
    "https://www.hallmarkchannel.com/falling-for-vermont"
  ],
  [
    "Falling for You",
    2018,
    "https://www.hallmarkchannel.com/fall-into-love/2018-fall-harvest-originals"
  ],
  [
    "Five Star Christmas",
    2020,
    "https://www.hallmarkchannel.com/five-star-christmas"
  ],
  [
    "Harvest Moon",
    2015,
    "https://www.hallmarkchannel.com/fall-harvest/all-new-originals"
  ],
  [
    "Love on the Sidelines",
    2016,
    "https://www.hallmarkchannel.com/valentines-day/countdown-to-valentines-day-schedule-2016"
  ],
  [
    "Love, Fall & Order",
    2019,
    "https://www.hallmarkchannel.com/fall-into-love/fall-harvest-2019-movies"
  ],
  [
    "Never Kiss a Man in a Christmas Sweater",
    2020,
    "https://www.hallmarkchannel.com/ashley-williams"
  ],
  [
    "The Birthday Wish",
    2017,
    "https://www.hallmarkchannel.com/jessy-schram"
  ],
  [
    "Under the Autumn Moon",
    2018,
    "https://www.hallmarkchannel.com/home-and-family/friday-october-12th-2018"
  ],
  [
    "Winter in Vail",
    2020,
    "https://www.hallmarkchannel.com/winterfest/new-movies-2020"
  ]
];
test('16 existing romance movies retain official Hallmark identity, year and network sources',()=>{
 assert.ok(catalog.movies.length>=121,'Previously verified titles must remain in the expanding catalog');
 assert.ok(catalog.movies.filter(m=>m.verification_status==='metadata_verified').length>=71);
 for(const [title,year,url] of references){
  const matches=catalog.movies.filter(m=>m.title===title&&m.release_year===year);
  assert.equal(matches.length,1,title);
  const [movie]=matches;
  assert.equal(movie.network,'Hallmark Channel',title);
  assert.equal(movie.source_name,'Hallmark Channel official title/year reference',title);
  assert.equal(movie.source_url,url,title);
  assert.equal(movie.verification_status,'metadata_verified',title);
  assert.equal(movie.is_demo,false,title);
  assert.ok(['title_only_unverified','machine_inferred_unverified'].includes(movie.facts_status),title);
  for(const field of ['synopsis','description','poster_url','poster_rights','production_company']){
   assert.equal(Object.hasOwn(movie,field),false,title+' must not invent '+field);
  }
 }
});
test('verified movie metadata does not imply scene or trope verification in the public loader',()=>{
 const loaded=validateStaticMovies(catalog);
 for(const [title,year] of references){
  const movie=loaded.find(m=>m.title===title&&m.release_year===year);
  assert.ok(movie,title);
  assert.equal(movie.verification_status,'metadata_verified',title);
  assert.notEqual(movie.facts_status,'scene_verified',title);
 }
});
