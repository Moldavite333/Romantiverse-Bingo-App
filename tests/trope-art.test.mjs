import test from 'node:test';
import assert from 'node:assert/strict';
import {tropeArtDataUri} from '../src/engine/tropeArt.mjs';
test('compatibility artwork API returns deterministic dedicated offline paths',()=>{
 const t={id:'coincidence',label:'A coincidence',category:'cheese'};
 assert.equal(tropeArtDataUri(t),'/illustrations/coincidence.webp');
 assert.equal(tropeArtDataUri(t),tropeArtDataUri(t));
 assert.notEqual(tropeArtDataUri(t),tropeArtDataUri({id:'room-a-surprise-visitor',label:'A surprise visitor'}));
});
test('unregistered art is explicit and labels cannot inject artwork markup',()=>{
 assert.equal(tropeArtDataUri({id:'unknown',label:'<script>alert(1)</script>'}),null);
 assert.equal(tropeArtDataUri({id:'coincidence',label:'<script>alert(1)</script>'}),null);
});
