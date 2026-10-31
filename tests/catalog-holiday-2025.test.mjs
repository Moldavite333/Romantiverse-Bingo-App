import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const catalog=JSON.parse(readFileSync(new URL('../public/catalog/movies.json',import.meta.url),'utf8'));
const added=[
  {
    "title": "A Pickleball Christmas",
    "year": 2025,
    "network": "Lifetime",
    "url": "https://www.mylifetime.com/movies/a-pickleball-christmas"
  },
  {
    "title": "A Runaway Bride For Christmas",
    "year": 2025,
    "network": "Lifetime",
    "url": "https://www.mylifetime.com/movies/a-runaway-bride-for-christmas"
  },
  {
    "title": "Thank God: Christmas at the Keller Ranch",
    "year": 2025,
    "network": "Lifetime",
    "url": "https://www.mylifetime.com/movies/thank-god-christmas-at-the-keller-ranch"
  },
  {
    "title": "Rodeo Christmas Romance",
    "year": 2025,
    "network": "Lifetime",
    "url": "https://www.mylifetime.com/movies/rodeo-christmas-romance"
  },
  {
    "title": "The Christmas Campaign",
    "year": 2025,
    "network": "Lifetime",
    "url": "https://www.mylifetime.com/movies/the-christmas-campaign"
  },
  {
    "title": "Christmas in Alaska",
    "year": 2025,
    "network": "Lifetime",
    "url": "https://www.mylifetime.com/movies/christmas-in-alaska"
  },
  {
    "title": "A Christmas Cookbook",
    "year": 2025,
    "network": "Lifetime",
    "url": "https://www.mylifetime.com/movies/a-christmas-cookbook"
  },
  {
    "title": "Santa Tell Me",
    "year": 2024,
    "network": "Hallmark Channel",
    "url": "https://www.hallmarkchannel.com/santa-tell-me"
  },
  {
    "title": "A Newport Christmas",
    "year": 2025,
    "network": "Hallmark Channel",
    "url": "https://www.hallmarkchannel.com/a-newport-christmas/about-a-newport-christmas"
  },
  {
    "title": "Christmas Above the Clouds",
    "year": 2025,
    "network": "Hallmark Channel",
    "url": "https://www.hallmarkchannel.com/christmas-above-the-clouds/about-christmas-above-the-clouds"
  },
  {
    "title": "We Met in December",
    "year": 2025,
    "network": "Hallmark Channel",
    "url": "https://www.hallmarkchannel.com/we-met-in-december/about-we-met-in-december"
  }
];

test('2024–2025 holiday additions are independently source-verified, unique and searchable by title',()=>{
  assert.ok(catalog.movies.length>=121);
  for(const {title,year,network,url} of added){
    const matches=catalog.movies.filter(m=>m.title===title&&m.release_year===year);
    assert.equal(matches.length,1,title);
    const m=matches[0];
    assert.equal(m.network,network,title);
    assert.equal(m.source_url,url,title);
    assert.equal(m.verification_status,'metadata_verified',title);
    assert.equal(m.season,'Christmas',title);
    assert.equal(m.is_demo,false,title);
  }
});

test('new metadata-only movies never claim observed scenes, copyrighted summaries or poster rights',()=>{
  for(const {title,year} of added){
    const m=catalog.movies.find(m=>m.title===title&&m.release_year===year);
    assert.deepEqual(m.story_facts,{setting:[],relationship:[],conflict:[],event:[]},title);
    assert.equal(m.facts_status,'title_only_unverified',title);
    for(const field of ['synopsis','description','poster_url','poster_rights','production_company']){
      assert.equal(Object.hasOwn(m,field),false,title+' must not invent '+field);
    }
  }
});

test('new IDs are native-compatible and title/year combinations remain unique',()=>{
  const ids=new Set(),titles=new Set();
  for(const m of catalog.movies){
    assert.match(m.id,/^[a-z0-9][a-z0-9-]{0,119}$/);
    assert.ok(!ids.has(m.id),'Duplicate ID '+m.id);
    ids.add(m.id);
    const key=m.title.toLocaleLowerCase('en-US')+'|'+m.release_year;
    assert.ok(!titles.has(key),'Duplicate movie '+key);
    titles.add(key);
  }
});
