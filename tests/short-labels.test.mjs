import test from 'node:test';
import assert from 'node:assert/strict';
import entries from '../src/art/illustrations.json' with {type:'json'};
import aliases from '../src/art/room-illustration-aliases.json' with {type:'json'};
import labels from '../src/engine/shortLabels.json' with {type:'json'};
import {shortLabel} from '../src/engine/shortLabels.mjs';

test('short board labels cover every active illustration without changing canonical data',()=>{
 for(const e of entries.filter(e=>e.active)){
  assert.ok(labels[e.id],e.id);const before=JSON.stringify(e);
  assert.equal(typeof shortLabel(e),'string');assert.equal(JSON.stringify(e),before);
  if(e.id!=='free')assert.ok(shortLabel(e).length<=21,e.id);
 }
});
test('legacy multiplayer aliases receive the same short label as their canonical scene',()=>{
 for(const [label,id] of Object.entries(aliases))assert.equal(shortLabel({id:'cheese-0',label}),shortLabel(entries.find(e=>e.id===id)),label);
 assert.equal(shortLabel({id:'unknown',label:'Imported scene'}),'Imported scene');
});
