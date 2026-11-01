import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateStaticMovies} from '../src/services/staticCatalog.js';

const catalog=JSON.parse(readFileSync(new URL('../public/catalog/movies.json',import.meta.url),'utf8'));
const evidence=[
  [
    "Marrying Father Christmas",
    2018,
    "Hallmark Mystery",
    "Hallmark Mystery official 2018 premiere guide",
    "https://www.hallmarkmystery.com/christmas/miracles-of-christmas-2018-preview/"
  ],
  [
    "Return to Christmas Creek",
    2018,
    "Hallmark Mystery",
    "Hallmark Mystery official 2018 premiere guide",
    "https://www.hallmarkmystery.com/christmas/miracles-of-christmas-2018-preview/"
  ],
  [
    "Five More Minutes",
    2021,
    "Hallmark Mystery",
    "Hallmark Mystery official 2021 premiere guide",
    "https://www.hallmarkmystery.com/christmas/miracles-of-christmas-2021-preview/%2A%2A"
  ],
  [
    "Love's Portrait",
    2022,
    "Hallmark Mystery",
    "Hallmark Mystery official September 2022 premieres",
    "https://www.hallmarkmystery.com/september-2022-movies"
  ],
  [
    "Love Under the Olive Tree",
    2020,
    "Hallmark Channel",
    "TV Insider 2020 Hallmark Channel premiere report",
    "https://www.tvinsider.com/938474/love-under-the-olive-tree-hallmark-channel/"
  ],
  [
    "Noel Next Door",
    2022,
    "Hallmark Channel",
    "Hallmark Channel official 2022 Christmas retrospective",
    "https://www.hallmarkchannel.com/christmas-in-july/christmas-in-july-marathons-all-month-long"
  ],
  [
    "The Christmas Card",
    2006,
    "Hallmark Channel",
    "TV Insider Hallmark Channel 2006 movie listing",
    "https://www.tvinsider.com/show/the-christmas-card/"
  ],
  [
    "The Lost Valentine",
    2011,
    "CBS",
    "CBS original Hallmark Hall of Fame premiere report",
    "https://www.paramountpressexpress.com/cbs-entertainment/releases/view?id=27411"
  ]
];
const priorStoryFacts={
  "Marrying Father Christmas": {
    "setting": [],
    "relationship": [
      "family"
    ],
    "conflict": [],
    "event": [
      "christmas"
    ]
  },
  "Return to Christmas Creek": {
    "setting": [],
    "relationship": [],
    "conflict": [],
    "event": [
      "christmas"
    ]
  },
  "Five More Minutes": {
    "setting": [],
    "relationship": [],
    "conflict": [],
    "event": []
  },
  "Love's Portrait": {
    "setting": [],
    "relationship": [],
    "conflict": [],
    "event": []
  },
  "Love Under the Olive Tree": {
    "setting": [],
    "relationship": [],
    "conflict": [],
    "event": []
  },
  "Noel Next Door": {
    "setting": [],
    "relationship": [],
    "conflict": [],
    "event": []
  },
  "The Christmas Card": {
    "setting": [],
    "relationship": [],
    "conflict": [],
    "event": []
  },
  "The Lost Valentine": {
    "setting": [],
    "relationship": [],
    "conflict": [],
    "event": []
  }
};

test('eight additional romance titles have sourced identity, premiere year and original network',()=>{
 assert.ok(catalog.movies.length>=121,'Previously verified titles must remain in the expanding catalog');
 assert.ok(catalog.movies.filter(m=>m.verification_status==='metadata_verified').length>=99);
 for(const [title,year,network,source_name,source_url] of evidence){
  const matches=catalog.movies.filter(m=>m.title===title&&m.release_year===year);
  assert.equal(matches.length,1,title);
  const movie=matches[0];
  assert.equal(movie.network,network,title);
  assert.equal(movie.source_name,source_name,title);
  assert.equal(movie.source_url,source_url,title);
  assert.equal(movie.verification_status,'metadata_verified',title);
  assert.equal(movie.is_demo,false,title);
  assert.equal(movie.facts_status,'title_only_unverified',title);
  assert.deepEqual(movie.story_facts,priorStoryFacts[title],title+' existing story tags must remain unchanged');
  for(const field of ['synopsis','description','poster_url','poster_rights','production_company','notes','private_notes','hq_notes']){
   assert.equal(Object.hasOwn(movie,field),false,title+' must not invent or leak '+field);
  }
 }
});

test('The Lost Valentine was a Hallmark Hall of Fame production broadcast originally on CBS',()=>{
 const movie=catalog.movies.find(m=>m.title==='The Lost Valentine');
 assert.equal(movie.network,'CBS','Do not confuse Hallmark producer/brand with original broadcaster');
 assert.match(movie.source_url,/paramountpressexpress\.com/);
});

test('public catalog projection retains metadata verification without claiming scenes were observed',()=>{
 const movies=validateStaticMovies(catalog);
 for(const [title,year] of evidence){
  const movie=movies.find(m=>m.title===title&&m.release_year===year);
  assert.ok(movie,title);
  assert.equal(movie.verification_status,'metadata_verified',title);
  assert.notEqual(movie.facts_status,'scene_verified',title);
 }
});
