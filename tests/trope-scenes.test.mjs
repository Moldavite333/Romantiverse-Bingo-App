import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENE_ART,SCENE_LABELS,tropeSceneSvg} from '../src/engine/tropeScenes.mjs';
import {tropeArtDataUri} from '../src/engine/tropeArt.mjs';

test('the 25 illustrated Bingo moments each use dedicated, deterministic scenes',()=>{
 assert.equal(SCENE_LABELS.length,25);
 const images=SCENE_LABELS.map(label=>tropeSceneSvg(label,'cheese'));
 assert.equal(new Set(images).size,SCENE_LABELS.length,'no duplicated scene SVGs');
 for(const [i,svg] of images.entries()){
  assert.match(svg,/^<svg[^>]+viewBox="0 0 128 128"/);
  assert.match(svg,/<g|<path/);
  assert.ok(!svg.includes('<script')&&!svg.includes('<foreignObject'));
  assert.ok(!svg.includes('<image '));
  assert.equal(svg,decodeURIComponent(tropeArtDataUri({label:SCENE_LABELS[i],category:'cheese'}).split(',')[1]));
 }
});
test('free center art is branded and distinct from the Christmas wreath fallback',()=>{
 const free=decodeURIComponent(tropeArtDataUri({label:'FREE SPACE',category:'free'}).split(',')[1]);
 assert.equal(free,SCENE_ART['cheese louise pod']);
 assert.notEqual(free,tropeSceneSvg('A Christmas wish','seasonal'));
});
test('unrecognized tropes keep offline safe legacy fallback',()=>{
 assert.equal(tropeSceneSvg('A brand new trope','cheese'),null);
 const uri=tropeArtDataUri({label:'A brand new trope',category:'cheese'});
 assert.ok(uri.startsWith('data:image/svg+xml'));
});
