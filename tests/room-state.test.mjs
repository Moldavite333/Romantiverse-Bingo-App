import test from 'node:test';
import assert from 'node:assert/strict';
import {nextPlayerSnapshot} from '../src/engine/roomState.mjs';

test('a delayed poll cannot overwrite a newer confirmed mark', () => {
  const empty={revision:-1,marked:[]};
  const initial=nextPlayerSnapshot(empty,{revision:0,marked:[12]});
  const afterMark=nextPlayerSnapshot(initial,{revision:1,marked:[2,12]});
  const latePoll=nextPlayerSnapshot(afterMark,{revision:0,marked:[12]});
  assert.strictEqual(latePoll,afterMark);
  assert.deepEqual(latePoll.marked,[2,12]);
});

test('fresh revisions update marks and preserve undo operations', () => {
  const old={revision:4,marked:[2,12]};
  const updated=nextPlayerSnapshot(old,{revision:5,marked:[12]});
  assert.deepEqual(updated,{revision:5,marked:[12]});
  assert.deepEqual(nextPlayerSnapshot(updated,{revision:6,marked:[7,12]}),{revision:6,marked:[7,12]});
});

test('invalid or incomplete snapshots do not damage a visible card', () => {
  const old={revision:3,marked:[12]};
  for(const response of [null,{}, {revision:4}, {revision:-1,marked:[]},
    {revision:4,marked:[-1]}, {revision:4,marked:[25]}, {revision:4,marked:['12']}])
    assert.strictEqual(nextPlayerSnapshot(old,response),old);
});

test('duplicate marked indices normalize without changing the revision', () => {
  assert.deepEqual(nextPlayerSnapshot({revision:0,marked:[12]},{revision:1,marked:[12,3,3]}),
    {revision:1,marked:[3,12]});
});
