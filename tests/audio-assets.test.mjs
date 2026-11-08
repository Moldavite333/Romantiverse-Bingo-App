import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
test('all six bundled recordings retain their CC0 source evidence and exact original bytes',async()=>{
 const rows=JSON.parse(await readFile('public/audio/provenance.json','utf8'));
 assert.deepEqual(rows.map(e=>e.cue).sort(),['blackout','deal','mark','near','undo','win']);
 for(const row of rows){
  assert.equal(row.license,'CC0-1.0');assert.ok(row.sourcePack.startsWith('https://kenney.nl/assets/')||row.sourcePack==='https://opengameart.org/content/classic-fanfare-lick');
  assert.equal(row.file,(row.cue==='win'?'win-grand':row.cue)+'.ogg');const bytes=await readFile('public/audio/'+row.file);
  assert.equal(bytes.toString('ascii',0,4),'OggS');assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256);
 }
 for(const pack of ['casino','interface','jingles','fanfare'])assert.match(await readFile(`public/audio/LICENSE-${pack}.txt`,'utf8'),/CC0/);
});
