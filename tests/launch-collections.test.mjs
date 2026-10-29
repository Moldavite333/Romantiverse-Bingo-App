import test from 'node:test';
import assert from 'node:assert/strict';
import {LAUNCH_THEMES,LAUNCH_SEASONAL_THEMES,isLaunchMovie} from '../src/engine/launchCollections.mjs';

test('launch themes are romance, Christmas and fall only', () => {
  assert.deepEqual([...LAUNCH_THEMES], ['Romance', 'Christmas', 'Fall']);
  assert.deepEqual([...LAUNCH_SEASONAL_THEMES], ['Christmas', 'Fall']);
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
