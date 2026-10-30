import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../supabase/functions/game-room/index.ts',import.meta.url),'utf8');

test('deployed multiplayer source uses simplified Cheese Louise trope wording',()=>{
  for(const retired of [
    'An impossibly cute first meeting',
    'A completely avoidable misunderstanding',
    'A wildly dramatic romantic gesture',
    'A very late romantic realization',
    'A suspiciously perfect stranger',
    'A perfectly timed interruption'
  ])assert.ok(!source.includes("'"+retired+"'"),'Retired multiplayer trope must not return: '+retired);
  for(const label of ['First meeting','A misunderstanding','A romantic gesture','A romantic realization']){
    assert.ok(source.includes("'"+label+"'"),'Expected canonical multiplayer trope: '+label);
  }
});

test('multiplayer backend preserves collection metadata separately from card theme',()=>{
  assert.match(source,/movie_collection:movieCollection/);
  assert.match(source,/card\(room\.season,existing\.map\(p=>p\.card\)\)/);
  assert.match(source,/movie_collection:r\.movie_collection/);
});

test('multiplayer backend retains server-owned per-player cards and private token hashes',()=>{
  assert.match(source,/token_hash:await hash\(secret\)/);
  assert.match(source,/card:card\(room\.season,existing\.map\(p=>p\.card\)\)/);
  assert.match(source,/player\.card/);
});
