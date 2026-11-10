import test from 'node:test';
import assert from 'node:assert/strict';
import {commonMomentWeight,weightedMoments} from '../supabase/functions/_shared/commonMoments.mjs';
import {buildCard,seededRandom} from '../src/engine/intelligence.mjs';

test('common-moment dealing favors everyday romance over specific set pieces',()=>{
 const pool=['A shared meal','A heartfelt apology','A supportive friend','A rescued duckling changes the day','A lifeguard comes to the rescue','An unexpected sleigh ride'].map(label=>({label}));
 let common=0;
 for(let seed=1;seed<=1000;seed++)common+=weightedMoments(pool,seededRandom(seed)).slice(0,3).filter(t=>commonMomentWeight(t.label)===4).length;
 assert.ok(common>2400,'Common moments should occupy over 80% of these draws, versus 50% with equal dealing');
});
test('new default cards have fewer seasonal requirements without changing wins or saved input',()=>{
 for(const season of ['Christmas','Fall','Spring','Summer'])for(let seed=0;seed<20;seed++){
  const movie={title:'A Romance',season};
  const card=buildCard(movie,{seed});
  assert.equal(card.filter(t=>t.category==='seasonal').length,8);
  assert.equal(card[12].id,'free');
  assert.equal(new Set(card.map(t=>t.label)).size,25);
  assert.deepEqual(card,buildCard(movie,{seed}));
 }
});
