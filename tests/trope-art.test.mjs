import test from 'node:test';
import assert from 'node:assert/strict';
import {tropeArtDataUri} from '../src/engine/tropeArt.mjs';

const svg=trope=>decodeURIComponent(tropeArtDataUri(trope).split(',')[1]);

test('every Bingo square has deterministic offline illustration',()=>{
 for(const trope of [
  {label:'Pumpkin patch encounter',category:'seasonal'},
  {label:'A power outage',category:'seasonal'},
  {label:'A Christmas miracle',category:'seasonal'},
  {label:'Return to hometown',category:'cheese'},
  {label:'FREE SPACE',category:'free'},
  {label:'An unfamiliar new trope',category:'cheese'}
 ]){
  const a=tropeArtDataUri(trope);
  assert.match(a,/^data:image\/svg\+xml;charset=UTF-8,/);
  assert.equal(a,tropeArtDataUri(trope));
  assert.match(svg(trope),/<svg[^>]*viewBox="0 0 128 128"/);
  assert.match(svg(trope),/<path|<circle|<ellipse|<rect/);
  assert.ok(!a.includes('https://'));
 }
});
test('seasonal squares use relevant illustration motifs',()=>{
 assert.match(svg({label:'Pumpkin patch encounter',category:'seasonal'}),/<ellipse cx="64"/);
 assert.match(svg({label:'An eerie ghost',category:'seasonal'}),/<circle cx="51" cy="57"/);
 assert.match(svg({label:'Apple-picking date',category:'seasonal'}),/C29 20/);
});
test('untrusted trope labels cannot inject SVG markup',()=>{
 const art=svg({label:'<script>alert("bad")</script>',category:'cheese'});
 assert.doesNotMatch(art,/<script>/);
 assert.match(art,/<svg/);
});
