import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCard} from '../src/engine/intelligence.mjs';
import {hasRetiredTrope,refreshUntouchedCard} from '../src/engine/retiredTropes.mjs';

const movie={title:'Christmas at the Bakery',season:'Christmas',synopsis:'A lawyer returns home to save the family bakery.'};
const retired={id:'cozy-drink',label:'An emotionally significant hot beverage',category:'cheese'};
function saved(marked=[12],completed=false){
 const card=buildCard(movie,{seed:29,free:true});
 card[3]=retired;
 return {movie,card,marked,completed,free:true,cardTheme:'Christmas',mode:'classic'};
}
test('an untouched saved card replaces the retired trope without changing other squares or marks',()=>{
 const old=saved();
 const next=refreshUntouchedCard(old);
 assert.notStrictEqual(next,old);
 assert.equal(hasRetiredTrope(next),false);
 assert.deepEqual(next.marked,[12]);
 assert.equal(next.card.length,25);
 assert.equal(new Set(next.card.map(t=>t.id)).size,25);
 assert.deepEqual(next.card.filter((_,i)=>i!==3),old.card.filter((_,i)=>i!==3));
 assert.equal(hasRetiredTrope(old),true);
});
test('played or completed cards are never silently rewritten',()=>{
 for(const game of [saved([12,3]),saved([12,4]),saved([12],true)]){
  assert.strictEqual(refreshUntouchedCard(game),game);
  assert.equal(hasRetiredTrope(game),true);
 }
});
test('current cards and malformed legacy saves are left alone',()=>{
 const current={movie,card:buildCard(movie,{seed:13}),marked:[12],completed:false};
 assert.strictEqual(refreshUntouchedCard(current),current);
 for(const value of [null,{}, {card:[retired],marked:[],movie}]){
  assert.strictEqual(refreshUntouchedCard(value),value);
 }
});

test('legacy imported retired squares are replaced only before play starts',()=>{
 const game=saved();
 game.card[3]={...retired,id:'cl-cozy-drink'};
 assert.equal(hasRetiredTrope(refreshUntouchedCard(game)),false);
 game.card[3]={...retired,id:'old-imported-id',label:' AN EMOTIONALLY SIGNIFICANT HOT BEVERAGE '};
 assert.equal(hasRetiredTrope(refreshUntouchedCard(game)),false);
});
test('a marked center is actual progress on cards without a free square',()=>{
 const card=buildCard(movie,{seed:30,free:false});
 card[3]={...retired,id:'cl-cozy-drink'};
 const played={movie,card,marked:[12],completed:false,free:false,cardTheme:'Christmas'};
 assert.strictEqual(refreshUntouchedCard(played),played);
 const untouched={...played,marked:[]};
 assert.equal(hasRetiredTrope(refreshUntouchedCard(untouched)),false);
});
