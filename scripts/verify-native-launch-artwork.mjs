#!/usr/bin/env node
/**
 * Native Android launch-artwork contract.
 *
 * Reads the authoritative public multiplayer labels directly from the room
 * function and the native exact-label scene map. No private HQ data, network
 * requests, generated cards, or browser artwork are involved.
 *
 * This is a ratcheting coverage gate, NOT a claim of full artistic sign-off.
 * Increase MIN_ILLUSTRATED as independently reviewed scenes are added.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const roomSource = readFileSync('supabase/functions/game-room/index.ts', 'utf8');
const nativeSource = readFileSync(
  'android/app/src/main/java/com/cheeselouise/romantiverse/BingoStoryScenes.kt',
  'utf8'
);

function literal(name, pattern) {
  const match = roomSource.match(pattern);
  assert.ok(match, `Cannot extract authoritative ${name} inventory`);
  // Only evaluate the captured array/object literal in an isolated context.
  return vm.runInNewContext('(' + match[1] + ')', Object.create(null), { timeout: 1000 });
}

const cheese = literal('cheese', /const cheese=(\[[^\n]*\]);/);
const themes = literal('themes', /const themes=(\{[^\n]*\});/);
const groups = { Cheese: cheese, Romance: themes.Romance, Christmas: themes.Christmas, Fall: themes.Fall };
for (const [group, labels] of Object.entries(groups)) {
  assert.ok(Array.isArray(labels) && labels.every(label => typeof label === 'string' && label.trim()),
    `Invalid ${group} launch label inventory`);
  assert.equal(labels.length, group === 'Cheese' ? 30 : 28, `Unexpected ${group} inventory change; review artwork`);
  assert.equal(new Set(labels).size, labels.length, `Duplicate ${group} labels`);
}
const launch = [...new Set(Object.values(groups).flat())];
assert.equal(launch.length, 114, 'Launch inventory changed; audit every new trope illustration');

const mapped = [...nativeSource.matchAll(/^\s*"([^"]+)" to StoryScene\.([A-Z_]+),?$/gm)];
const art = new Map(mapped.map(([, label, scene]) => [label, scene]));
assert.equal(art.size, mapped.length, 'Duplicate native art label');
assert.equal(new Set(art.values()).size, art.size, 'Multiple labels share the same native scene');

const MIN_ILLUSTRATED = 38; // 14 original exact matches + 24 independent launch scenes.
const illustrated = launch.filter(label => art.has(label));
assert.ok(illustrated.length >= MIN_ILLUSTRATED,
  `Native launch art regressed: ${illustrated.length}/114, minimum ${MIN_ILLUSTRATED}`);

console.log(`Native multiplayer original scene coverage: ${illustrated.length}/${launch.length}`);
for (const [group, labels] of Object.entries(groups)) {
  const missing = labels.filter(label => !art.has(label));
  console.log(`  ${group}: ${labels.length - missing.length}/${labels.length} illustrated; ${missing.length} pending`);
  if (missing.length) console.log('    Missing: ' + missing.join(' | '));
}
if (process.argv.includes('--require-complete')) {
  assert.equal(illustrated.length, launch.length, 'Public launch blocked: shared motifs remain');
}
