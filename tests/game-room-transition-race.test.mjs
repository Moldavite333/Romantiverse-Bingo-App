import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(
  new URL('../supabase/functions/game-room/index.ts', import.meta.url), 'utf8'
);
const token = 'a'.repeat(64);
const hostId = 'host-player';
const roomId = 'room-1';
const code = 'ABCD234';

function makeServer(initialStatus, patchSucceeds) {
  let handler;
  const calls = [];
  const room = {
    id: roomId, code, host_player_id: hostId,
    movie_title: 'Autumn at Apple Hill', movie_collection: 'Fall',
    season: 'Romance', mode: 'classic', status: initialStatus,
    expires_at: '2099-01-01T00:00:00Z'
  };
  const player = {
    id: hostId, room_id: roomId, name: 'Host',
    token_hash: createHash('sha256').update(token).digest('hex'),
    card: [], marked: [12], free_center: true, revision: 0
  };
  const respond = data => new Response(JSON.stringify(data), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
  const fakeFetch = async (url, options) => {
    const path = String(url);
    calls.push({ path, method: options.method });
    if (path.includes('/rest/v1/live_rooms?code=eq.') && options.method === 'GET') {
      return respond([room]);
    }
    if (path.includes('/rest/v1/live_players?room_id=eq.') && options.method === 'GET') {
      return respond([player]);
    }
    if (path.includes('/rest/v1/live_rooms?id=eq.') && options.method === 'PATCH') {
      assert.match(path, /&status=eq\.(lobby|playing)&select=\*/);
      if (!patchSucceeds) return respond([]); // Another request won the transition.
      return respond([{ ...room, status: initialStatus === 'lobby' ? 'playing' : 'finished' }]);
    }
    throw Error('Unexpected storage operation: ' + options.method + ' ' + path);
  };
  runInNewContext(source, {
    Deno: {
      env: { get: name => name === 'SUPABASE_URL' ? 'https://unit.example' : 'service-key' },
      serve: fn => { handler = fn; }
    },
    fetch: fakeFetch, crypto: webcrypto,
    URL, Request, Response, TextEncoder, Uint8Array, Uint32Array
  });
  assert.equal(typeof handler, 'function');
  return { handler, calls };
}

async function transition(handler, action) {
  const response = await handler(new Request('https://unit.example/functions/v1/game-room', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, code, token })
  }));
  return { status: response.status, data: await response.json() };
}

for (const [status, action, expected] of [
  ['lobby', 'start', 'playing'],
  ['playing', 'finish', 'finished']
]) {
  test(`concurrent ${action} cannot claim success when conditional update loses`, async () => {
    const { handler, calls } = makeServer(status, false);
    const response = await transition(handler, action);
    assert.equal(response.status, 409);
    assert.match(response.data.error, /refresh/i);
    assert.equal('room' in response.data, false, 'Do not fabricate a new room status');
    assert.equal(calls.filter(call => call.method === 'PATCH').length, 1);
  });

  test(`successful ${action} returns the database-confirmed room status`, async () => {
    const { handler, calls } = makeServer(status, true);
    const response = await transition(handler, action);
    assert.equal(response.status, 200);
    assert.equal(response.data.room.status, expected);
    assert.equal(response.data.room.host_player_id, hostId);
    assert.equal('token_hash' in response.data.room, false);
    assert.equal('token' in response.data, false);
    assert.equal(calls.filter(call => call.method === 'PATCH').length, 1);
  });
}
