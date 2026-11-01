import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateStaticMovies} from '../src/services/staticCatalog.js';

const catalog=JSON.parse(readFileSync(new URL('../public/catalog/movies.json',import.meta.url),'utf8'));
const sources=[
  [
    "A Glenbrooke Christmas",
    2020,
    "Hallmark Mystery",
    "https://www.hallmarkmystery.com/miracles-of-christmas/miracles-of-christmas-2020-schedule/%26"
  ],
  [
    "A New Year's Resolution",
    2021,
    "Hallmark Channel",
    "https://www.hallmarkchannel.com/new-year-new-movies/new-year-new-movies-2021"
  ],
  [
    "A Winter Getaway",
    2021,
    "Hallmark Channel",
    "https://www.hallmarkchannel.com/new-year-new-movies/new-year-new-movies-2021"
  ],
  [
    "Beverly Hills Wedding",
    2021,
    "Hallmark Channel",
    "https://www.hallmarkchannel.com/love-ever-after/2021-romance-movies-love-ever-after"
  ],
  [
    "Christmas in Evergreen: Bells are Ringing",
    2020,
    "Hallmark Channel",
    "https://www.hallmarkchannel.com/christmas-in-evergreen-movies/about-the-movies"
  ],
  [
    "Christmas Waltz",
    2020,
    "Hallmark Channel",
    "https://www.hallmarkchannel.com/home-and-family/wednesday-november-25th-2020"
  ],
  [
    "Cranberry Christmas",
    2020,
    "Hallmark Mystery",
    "https://www.hallmarkmystery.com/christmas/miracles-of-christmas-2020-preview/%2A%2A"
  ],
  [
    "Don't Forget I Love You",
    2022,
    "Hallmark Channel",
    "https://www.hallmarkchannel.com/new-year-new-movies/new-in-2022"
  ],
  [
    "Holiday Date",
    2019,
    "Hallmark Channel",
    "https://www.hallmarkchannel.com/home-and-family/tuesday-december-10th-2019"
  ],
  [
    "Holly & Ivy",
    2020,
    "Hallmark Mystery",
    "https://www.hallmarkmystery.com/christmas/miracles-of-christmas-2020-preview/%2A%2A"
  ],
  [
    "Just My Type",
    2020,
    "Hallmark Channel",
    "https://www.hallmarkchannel.com/spring-fling/2020-spring-fling-movies"
  ],
  [
    "Love in Winterland",
    2020,
    "Hallmark Channel",
    "https://www.hallmarkchannel.com/winterfest/new-movies-2020"
  ],
  [
    "Love, Classified",
    2022,
    "Hallmark Channel",
    "https://www.hallmarkchannel.com/whats-airing-on-hallmark-channel-this-month-april-2022"
  ],
  [
    "Mix Up in the Mediterranean",
    2021,
    "Hallmark Channel",
    "https://www.hallmarkchannel.com/love-ever-after/2021-romance-movies-love-ever-after"
  ],
  [
    "Playing Cupid",
    2021,
    "Hallmark Channel",
    "https://www.hallmarkchannel.com/love-ever-after/2021-romance-movies-love-ever-after"
  ],
  [
    "Snowkissed",
    2021,
    "Hallmark Channel",
    "https://www.hallmarkchannel.com/new-year-new-movies/new-year-new-movies-2021"
  ],
  [
    "Swept Up by Christmas",
    2020,
    "Hallmark Mystery",
    "https://www.hallmarkmystery.com/miracles-of-christmas/miracles-of-christmas-2020-schedule/%26"
  ],
  [
    "Taking a Shot at Love",
    2021,
    "Hallmark Channel",
    "https://www.hallmarkchannel.com/new-year-new-movies/new-year-new-movies-2021"
  ],
  [
    "Two for the Win",
    2021,
    "Hallmark Channel",
    "https://www.hallmarkchannel.com/new-year-new-movies/new-year-new-movies-2021"
  ],
  [
    "USS Christmas",
    2020,
    "Hallmark Mystery",
    "https://www.hallmarkmystery.com/miracles-of-christmas/miracles-of-christmas-2020-schedule/%26"
  ]
];

test('20 additional romance and holiday titles have original-network and year evidence',()=>{
 assert.equal(catalog.movies.length,121,'No titles added or removed');
 assert.equal(catalog.movies.filter(m=>m.verification_status==='metadata_verified').length,91);
 for(const [title,year,network,url] of sources){
  const matches=catalog.movies.filter(m=>m.title===title&&m.release_year===year);
  assert.equal(matches.length,1,title);
  const [movie]=matches;
  assert.equal(movie.network,network,title);
  assert.equal(movie.source_name,network+' official title/year reference',title);
  assert.equal(movie.source_url,url,title);
  assert.equal(movie.verification_status,'metadata_verified',title);
  assert.equal(movie.is_demo,false,title);
  assert.ok(['title_only_unverified','machine_inferred_unverified'].includes(movie.facts_status),title);
  for(const field of ['synopsis','description','poster_url','poster_rights','production_company']){
   assert.equal(Object.hasOwn(movie,field),false,title+' must not invent '+field);
  }
 }
});

test('verified movie identities do not assert scenes, tropes or private HQ details',()=>{
 const loaded=validateStaticMovies(catalog);
 for(const [title,year] of sources){
  const movie=loaded.find(m=>m.title===title&&m.release_year===year);
  assert.ok(movie,title);
  assert.equal(movie.verification_status,'metadata_verified',title);
  assert.notEqual(movie.facts_status,'scene_verified',title);
  for(const field of ['notes','private_notes','hq_notes','watchalong_notes','synopsis','poster_url']){
   assert.equal(Object.hasOwn(movie,field),false,title+' public projection');
  }
 }
});
