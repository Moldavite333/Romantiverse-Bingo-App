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
