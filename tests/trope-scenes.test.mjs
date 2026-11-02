import test from 'node:test';
import assert from 'node:assert/strict';
import aliases from '../src/engine/roomIllustrationAliases.json' with {type:'json'};
import {ILLUSTRATIONS,illustrationFor} from '../src/engine/tropeArt.mjs';
import {roomTropeLabels} from '../scripts/validate-illustrations.mjs';
test('every server-side room label resolves through its explicit canonical alias',()=>{
 for(const label of roomTropeLabels()){
  const row=illustrationFor({id:'seasonal-0',label});
  assert.equal(row?.id,aliases[label],label);
 }
 assert.equal(illustrationFor({id:'seasonal-0',label:'A new unapproved trope'}),null);
});
test('free center has its own Cheese Louise identity',()=>{
 const free=illustrationFor({id:'free',label:'FREE SPACE',category:'free'});
 assert.equal(free.label,'CHEESE LOUISE POD');
 assert.notEqual(free.src,ILLUSTRATIONS['season-Christmas-11'].src);
});
