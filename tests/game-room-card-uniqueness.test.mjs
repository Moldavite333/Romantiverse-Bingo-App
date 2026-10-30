import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {webcrypto} from 'node:crypto';

const source = readFileSync(new URL('../supabase/functions/game-room/index.ts', import.meta.url), 'utf8');
function loadCard(code = source, crypto = webcrypto) {
  const context = {
    Deno: {env: {get: () => ''}, serve: () => {}},
    crypto, URL, Request, Response, TextEncoder, Uint8Array, Uint32Array
  };
  runInNewContext(code + '\nglobalThis.__dealRoomCard = card;', context);
  return context.__dealRoomCard;
}
const key = value => String(value).normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();

test('live room cards have 24 unique visible labels in all launch themes', () => {
  const deal = loadCard();
  for (const theme of ['Romance', 'Christmas', 'Fall']) {
    for (let n = 0; n < 101; n++) {
      const card = deal(theme);
      assert.equal(card.length, 25);
      assert.equal(card[12].category, 'free');
      assert.equal(card.filter(t => t.category === 'cheese').length, 12);
      assert.equal(card.filter(t => t.category === 'seasonal').length, 12);
      assert.equal(new Set(card.map(t => key(t.label))).size, 25, theme + ' deal ' + n);
    }
  }
});

test('room cards reject same visible label across base and seasonal pools', () => {
  const duplicated = source.replace(
    "'Second chance at love','Unexpected reunion'",
    "' First   meeting ','Unexpected reunion'"
  );
  assert.notEqual(duplicated, source);
  const card = loadCard(duplicated)('Romance');
  assert.equal(new Set(card.map(t => key(t.label))).size, 25);
});

test('a room card cannot knowingly repeat another player card', () => {
  // Fixed random stream forces every attempted shuffle to produce the same card.
  // The server must fail closed rather than issue a duplicate to another player.
  const crypto = {getRandomValues: bytes => { bytes.fill(0); return bytes; }};
  const deal = loadCard(source, crypto);
  const first = deal('Fall');
  assert.throws(() => deal('Fall', [first]), /distinct card/);
});
