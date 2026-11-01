import test from 'node:test';import assert from 'node:assert/strict';import {analyzeMovie,buildCard,replaceSquare,balance,visibleTropeKey} from '../src/engine/intelligence.mjs';import {winningLines} from '../src/engine/bingo.mjs';
const movie={title:'Holiday Reunion',season:'Christmas',synopsis:'A big-city executive returns home for Christmas to save the family bakery and reconnects with an old flame.'};
test('evidence traces back to synopsis',()=>{const a=analyzeMovie(movie);assert.ok(a.cheese.some(t=>t.evidence==='synopsis'&&t.reason.includes('bakery')))});
test('predictions never presented as verified',()=>assert.ok(analyzeMovie(movie).seasonal.every(t=>t.evidence==='prediction')));
test('same seed creates same card',()=>assert.deepEqual(buildCard(movie,{seed:4}),buildCard(movie,{seed:4})));
test('balanced 24-square card has 12 of each',()=>assert.deepEqual(balance(buildCard(movie,{seed:4})),{cheese:12,seasonal:12,total:24}));
test('no-free 25-square card contains 25 items',()=>assert.equal(buildCard(movie,{seed:4,free:false}).length,25));
test('no duplicate ids',()=>{const c=buildCard(movie,{seed:4});assert.equal(new Set(c.map(t=>t.id)).size,25)});
test('free center cannot be edited',()=>assert.throws(()=>replaceSquare(buildCard(movie),12,{id:'x',label:'X'})));
test('cannot duplicate a trope in editor',()=>{const c=buildCard(movie);assert.throws(()=>replaceSquare(c,1,c[0]))});
test('valid replacement is immutable',()=>{const c=buildCard(movie);const d=replaceSquare(c,0,{id:'custom',label:'My own',category:'cheese'});assert.equal(d[0].label,'My own');assert.notEqual(c[0].id,'custom')});
test('hard and easy cards are reproducible',()=>{for(const difficulty of ['easy','balanced','hard'])assert.deepEqual(buildCard(movie,{seed:42,difficulty}),buildCard(movie,{seed:42,difficulty}))});
test('invalid ratios rejected',()=>assert.throws(()=>buildCard(movie,{cheeseRatio:2})));
test('bingo still uses the standard 12 lines',()=>assert.equal(winningLines([0,1,2,3,4]).length,1));

test('all web cards have 24 distinct visible labels across seasons and seeds',()=>{for(const season of ['Christmas','Fall'])for(let seed=0;seed<101;seed++){const card=buildCard({...movie,season},{seed});assert.equal(new Set(card.map(visibleTropeKey)).size,25)}});
test('workshop rejects a different ID with the same visible label',()=>{const card=buildCard(movie);assert.throws(()=>replaceSquare(card,1,{id:'different-id',label:'  '+card[0].label.toUpperCase()+'  ',category:'cheese'}),/already on your card/)});
test('locked duplicate visible labels are rejected',()=>{const card=buildCard(movie,{seed:2});assert.throws(()=>buildCard(movie,{seed:2,locked:{0:{...card[1],id:'different-id'}}}),/Duplicate visible trope/)});

test('visible square identity collapses internal whitespace, including tabs and newlines',()=>{
 assert.equal(visibleTropeKey({label:' First   meeting\ttonight\n'}),visibleTropeKey({label:'first meeting tonight'}));
 const card=buildCard(movie,{seed:4});
 const spaced=card[0].label.replace(/ /g,'   ');
 assert.throws(()=>replaceSquare(card,1,{id:'other-id',label:'\t'+spaced+'\n',category:'cheese'}),/already on your card/);
});
