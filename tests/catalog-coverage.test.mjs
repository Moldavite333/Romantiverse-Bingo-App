import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const catalog=JSON.parse(readFileSync(new URL('../public/catalog/movies.json',import.meta.url),'utf8'));
const byTitle=new Map(catalog.movies.map(movie=>[movie.title,movie]));
const newlyVerified=[
  'A Very Merry Beauty Salon',
  'Make or Bake Christmas',
  'The Holiday Junkie',
  'Christmas at Plumhill Manor',
  'Holiday in Happy Hollow',
  'Engaged By Christmas',
  'How to Fall in Love By Christmas',
  'A Carpenter Christmas Romance',
  'Christmas in the Spotlight',
  'The Christmas Setup',
  'A Very Merry Toy Store',
  "Leah's Perfect Gift",
  'Two Scoops of Italy',
  'Peppermint and Postcards',
  'The Princess and the Bodyguard'
];

test('source-verified romance titles cover Lifetime, MarVista and Reel One',()=>{
  for(const title of newlyVerified){
    const movie=byTitle.get(title);
    assert.ok(movie,'Missing source-verified movie: '+title);
    assert.equal(movie.verification_status,'metadata_verified',title);
    assert.match(movie.source_url,/^https:\/\//,title);
    assert.ok(Number.isInteger(movie.release_year),title);
    assert.equal(movie.is_demo,false,title);
  }
  assert.ok(catalog.movies.filter(m=>m.network==='Lifetime').length>=10);
  assert.ok(catalog.movies.filter(m=>m.production_company==='MarVista Entertainment').length>=2);
  assert.ok(catalog.movies.filter(m=>m.production_company==='Reel One Entertainment').length>=2);
});

test('metadata-only imports never assert unobserved scenes or copy descriptions/posters',()=>{
  for(const title of newlyVerified){
    const movie=byTitle.get(title);
    assert.deepEqual(movie.story_facts,{setting:[],relationship:[],conflict:[],event:[]},title);
    assert.equal(movie.facts_status,'title_only_unverified',title);
    assert.equal('synopsis' in movie,false,title);
    assert.equal('description' in movie,false,title);
    assert.equal('poster_url' in movie,false,title);
  }
});

test('producer is distinct from original broadcast network',()=>{
  assert.equal(byTitle.get("Leah's Perfect Gift").network,'Hallmark Channel');
  assert.equal(byTitle.get("Leah's Perfect Gift").production_company,'MarVista Entertainment');
  assert.equal(byTitle.get('Peppermint and Postcards').network,undefined);
  assert.equal(byTitle.get('Peppermint and Postcards').production_company,'Reel One Entertainment');
});

const hallmarkSourceVerified=[
 ['A Biltmore Christmas',2023,'Hallmark Channel','https://www.hallmarkchannel.com/a-biltmore-christmas'],
 ['A Christmas Detour',2015,'Hallmark Channel','https://www.hallmarkchannel.com/a-christmas-detour'],
 ['A Christmas Melody',2015,'Hallmark Channel','https://www.hallmarkchannel.com/a-christmas-melody'],
 ['A December Bride',2016,'Hallmark Channel','https://www.hallmarkchannel.com/a-december-bride'],
 ['A Royal Christmas',2014,'Hallmark Channel','https://www.hallmarkchannel.com/a-royal-christmas'],
 ['All of My Heart',2015,'Hallmark Channel','https://www.hallmarkchannel.com/all-of-my-heart'],
 ['Autumn at Apple Hill',2024,'Hallmark Channel','https://www.hallmarkchannel.com/autumn-at-apple-hill'],
 ['Christmas on My Mind',2019,'Hallmark Mystery','https://www.hallmarkmystery.com/christmas-on-my-mind'],
 ['Christmas Under Wraps',2014,'Hallmark Channel','https://www.hallmarkchannel.com/christmas-under-wraps'],
 ['Crown for Christmas',2015,'Hallmark Channel','https://www.hallmarkchannel.com/crown-for-christmas'],
 ['Haul Out the Holly',2022,'Hallmark Channel','https://www.hallmarkchannel.com/haul-out-the-holly'],
 ['October Kiss',2015,'Hallmark Channel','https://www.hallmarkchannel.com/october-kiss'],
 ['Pumpkin Pie Wars',2016,'Hallmark Channel','https://www.hallmarkchannel.com/pumpkin-pie-wars'],
 ['Roadhouse Romance',2021,'Hallmark Channel','https://www.hallmarkchannel.com/roadhouse-romance'],
 ['Sweet Autumn',2020,'Hallmark Channel','https://www.hallmarkchannel.com/sweet-autumn']
];

test('15 existing Hallmark movies now have original-network source and year evidence',()=>{
 assert.ok(catalog.movies.length>=121,'Previously verified titles must remain in the expanding catalog');
 assert.ok(catalog.movies.filter(m=>m.verification_status==='metadata_verified').length>=44);
 for(const [title,year,network,url] of hallmarkSourceVerified){
  const movie=byTitle.get(title);
  assert.ok(movie,'Missing catalog title '+title);
  assert.equal(movie.release_year,year,title);
  assert.equal(movie.network,network,title);
  assert.equal(movie.source_url,url,title);
  assert.equal(movie.source_name,network+' official movie page',title);
  assert.equal(movie.verification_status,'metadata_verified',title);
  assert.equal(movie.is_demo,false,title);
  assert.ok(['title_only_unverified','machine_inferred_unverified'].includes(movie.facts_status),title);
  for(const field of ['synopsis','description','poster_url','poster_rights','production_company']){
   assert.equal(Object.hasOwn(movie,field),false,title+' must not invent '+field);
  }
 }
});
