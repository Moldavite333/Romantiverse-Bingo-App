import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const edge = readFileSync('supabase/functions/bingo-public-posters/index.ts', 'utf8');
const sql = readFileSync('supabase/migrations/20261029000000_bingo_poster_catalog_scale.sql', 'utf8');
const native = readFileSync('android/app/src/main/java/com/cheeselouise/romantiverse/PosterRepository.kt', 'utf8');

test('public poster service pages cache rather than silently truncating at 200 rows', () => {
  assert.match(edge, /const MAX_CATALOG_MOVIES=3000/);
  assert.match(edge, /offset<=MAX_CATALOG_MOVIES/);
  assert.match(edge, /order=title\.asc,release_year\.asc&limit=/);
  assert.match(edge, /all\.push\(\.\.\.rows\)/);
  assert.match(edge, /rows\.length<CACHE_PAGE_SIZE/);
  assert.doesNotMatch(edge, /checked_at&limit=200/);
});

test('background poster matching is bounded and continues after a backlog', () => {
  assert.match(edge, /MAX_REFRESH_PER_RUN=64/);
  assert.match(edge, /due\.slice\(0,MAX_REFRESH_PER_RUN\)/);
  assert.match(edge, /updateControl\(null,hasBacklog\)/);
  assert.match(edge, /hasBacklog\?15\*60\*1000/);
});

test('catalog growth claim and native poster parser accept up to 3000', () => {
  assert.match(sql, /p_catalog_count not between 1 and 3000/);
  assert.match(native, /MAX_POSTERS = 3000/);
  assert.match(native, /rows\.length\(\) <= MAX_POSTERS/);
  assert.match(native, /MAX_FEED_CHARS = 2_000_000/);
  assert.doesNotMatch(native, /minOf\(rows\.length\(\), 500\)/);
});
