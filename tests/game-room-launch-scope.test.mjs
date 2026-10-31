import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {webcrypto} from 'node:crypto';

const source = readFileSync(new URL('../supabase/functions/game-room/index.ts', import.meta.url), 'utf8');

function makeServer(room = null) {
  let handler;
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push({url: String(url), method: options.method});
    if (String(url).includes('/rest/v1/live_rooms?')) {
      return new Response(JSON.stringify(room ? [room] : []), {
        status: 200, headers: {'Content-Type': 'application/json'}
      });
    }
    throw new Error('Unexpected database access in launch-scope test');
  };
  runInNewContext(source, {
    Deno: {
      env: {get: name => name === 'SUPABASE_URL' ? 'https://unit.example' : 'test-service'},
      serve: fn => { handler = fn; }
    },
    fetch: fakeFetch,
    crypto: webcrypto,
    URL, Request, Response, TextEncoder, Uint8Array
  });
  assert.equal(typeof handler, 'function');
  return {handler, calls};
}

async function request(handler, body) {
  const response = await handler(new Request('https://unit.example/functions/v1/game-room', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  }));
  return {status: response.status, data: await response.json()};
}

test('public API rejects horror room creation before any database write', async () => {
  const {handler, calls} = makeServer();
  for (const [season, collection] of [
    ['Horror', 'Unspecified'], ['Romance', 'Horror'],
    ['Christmas', ' horror '], ['Fall', 'HORROR'], ['Unknown', 'Fall']
  ]) {
    const result = await request(handler, {
      action: 'create', name: 'Host', movie_title: 'A Movie',
      movie_collection: collection, season, mode: 'classic'
    });
    assert.equal(result.status, 400, season + '/' + collection);
  }
  assert.equal(calls.length, 0, 'Rejected creation must never reach storage');
});

test('legacy horror invitations cannot be previewed or joined', async () => {
  const base = {
    id: 'room-id', code: 'ABCD234', movie_title: 'A Movie',
    movie_collection: 'Horror', season: 'Romance',
    expires_at: '2099-01-01T00:00:00Z', status: 'lobby', mode: 'classic'
  };
  for (const room of [base, {...base, movie_collection: 'Fall', season: 'Horror'}]) {
    const {handler, calls} = makeServer(room);
    for (const action of ['preview', 'join']) {
      const result = await request(handler, {action, code: room.code, name: 'Guest'});
      assert.equal(result.status, 400, action);
      assert.match(result.data.error, /not available/i);
    }
    assert.equal(calls.length, 2, 'No player records may be created');
    assert.ok(calls.every(call => call.url.includes('/rest/v1/live_rooms?')));
  }
});

test('romance rooms remain previewable with their real collection', async () => {
  const room = {
    id: 'room-id', code: 'ABCD234', host_player_id: 'host-player-uuid', movie_title: 'Autumn at Apple Hill',
    movie_collection: 'Fall', season: 'Romance',
    expires_at: '2099-01-01T00:00:00Z', status: 'lobby', mode: 'classic'
  };
  const {handler} = makeServer(room);
  const result = await request(handler, {action: 'preview', code: room.code});
  assert.equal(result.status, 200);
  assert.equal(result.data.room.movie_collection, 'Fall');
  assert.equal(result.data.room.season, 'Romance');
  assert.equal(result.data.room.host_player_id, 'host-player-uuid');
  assert.equal('token' in result.data, false, 'Public previews must never contain credentials');
  assert.equal('token_hash' in result.data.room, false);
});


test('branded Bingo origin can make cross-origin multiplayer requests without opening access to arbitrary origins', async () => {
  const {handler} = makeServer();
  for (const origin of ['https://bingo.cheeselouisepod.com', 'https://moldavite333.github.io']) {
    const response = await handler(new Request('https://unit.example/functions/v1/game-room', {
      method: 'OPTIONS', headers: {Origin: origin}
    }));
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
  }
  const untrusted = await handler(new Request('https://unit.example/functions/v1/game-room', {
    method: 'OPTIONS', headers: {Origin: 'https://unrelated.example'}
  }));
  assert.notEqual(untrusted.headers.get('Access-Control-Allow-Origin'), 'https://unrelated.example');
});
