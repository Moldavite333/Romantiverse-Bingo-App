import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LAUNCH_THEMES,LAUNCH_SEASONAL_THEMES,isLaunchMovie} from '../src/engine/launchCollections.mjs';

test('public themes cover all seasons and evergreen romance', () => {
  assert.deepEqual([...LAUNCH_THEMES], ['Romance', 'Spring', 'Summer', 'Fall', 'Christmas']);
  assert.deepEqual([...LAUNCH_SEASONAL_THEMES], ['Spring', 'Summer', 'Fall', 'Christmas']);
  assert.equal(LAUNCH_THEMES.includes('Horror'), false);
});

test('explicit horror collections are excluded without guessing from titles', () => {
  assert.equal(isLaunchMovie({title:'A Romantic Movie',season:'Horror'}), false);
  assert.equal(isLaunchMovie({title:'A Romantic Movie',movie_collection:' horror '}), false);
  assert.equal(isLaunchMovie({title:'A Romantic Movie',collection:'HORROR'}), false);
  assert.equal(isLaunchMovie({title:'A Spooky Autumn Date',season:'Fall'}), true);
  assert.equal(isLaunchMovie({title:'A Christmas Romance',season:'Christmas'}), true);
  assert.equal(isLaunchMovie({title:'A Movie',season:'Unspecified'}), true);
  assert.equal(isLaunchMovie(null), false);
});

test('native multiplayer screen excludes horror and checks invite scope before joining', () => {
  const source = readFileSync(new URL('../android/app/src/main/java/com/cheeselouise/romantiverse/LiveRoomScreen.kt', import.meta.url), 'utf8');
  assert.equal(source.includes('"Horror"'), false, 'Do not expose Horror in the native launch UI');
  assert.match(source, /LaunchRoomScope\.themes\.forEach/);
  assert.match(source, /require\(LaunchRoomScope\.supports\(invited\.movie\.theme, invited\.movie\.collection\)\)/);
  assert.match(source, /require\(LaunchRoomScope\.supports\(theme, movie\.collection\)\)/);
});
