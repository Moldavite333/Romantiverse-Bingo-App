import test from 'node:test';import assert from 'node:assert/strict';
import {extractStoryFacts} from '../src/engine/storyFacts.mjs';
import {analyzeMovie,buildCard,balance} from '../src/engine/intelligence.mjs';
test('facts-only catalog generates deterministic, independent Bingo cards',()=>{
 const story='A lawyer returns to her hometown to help with the fall festival and meets her former sweetheart.';
 const movie={title:'Example Romance',season:'Fall',story_facts:extractStoryFacts(story)};
 const a=buildCard(movie,{seed:2026,free:true,cheeseRatio:.5});
 const b=buildCard(movie,{seed:2026,free:true,cheeseRatio:.5});
 assert.deepEqual(a,b);assert.equal(a.length,25);assert.equal(a[12].category,'free');
 assert.deepEqual(balance(a),{cheese:12,seasonal:12,total:24});
 assert.equal(new Set(a.map(t=>t.id)).size,25);
 assert.ok(analyzeMovie(movie).cheese.some(t=>t.evidence==='synopsis'));
 assert.ok(!JSON.stringify(movie).includes(story));
});
test('a movie with no synopsis or facts can still make a valid card',()=>{
 const card=buildCard({title:'Unknown Holiday Movie',season:'Christmas'},{seed:12});
 assert.equal(card.length,25);
});
