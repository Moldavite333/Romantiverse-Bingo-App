import test from 'node:test';
import assert from 'node:assert/strict';
import {tropeArtDataUri,ILLUSTRATIONS,illustrationFor} from '../src/engine/tropeArt.mjs';
test('all approved canonical illustrations resolve deterministically',()=>{
 for(const row of Object.values(ILLUSTRATIONS)){
  const trope={id:row.id,label:row.label};
  assert.equal(illustrationFor(trope)?.id,row.id);
  assert.equal(tropeArtDataUri(trope),'/'+row.src);
  assert.equal(tropeArtDataUri(trope),tropeArtDataUri(trope));
 }
});
test('untrusted or unregistered inputs cannot inject image URLs',()=>{
 for(const trope of [{label:'<script>alert(1)</script>'},{id:'unknown',label:'A Christmas wish',image_url:'https://evil.test/x'}])assert.equal(tropeArtDataUri(trope),null);
});
