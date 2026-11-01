import test from 'node:test';
import assert from 'node:assert/strict';
import {ILLUSTRATIONS,illustrationFor,tropeArtDataUri} from '../src/engine/tropeArt.mjs';
import {auditIllustrations,canonicalTropes,differenceHash,hashDistance} from '../scripts/validate-illustrations.mjs';
test('every canonical trope and branded center has a dedicated valid illustration',async()=>{
 const report=await auditIllustrations();
 assert.equal(report.canonicalTropes,158);
 assert.deepEqual(report.errors,[]);
 assert.equal(report.ready,159);
 for(const trope of canonicalTropes())assert.equal(illustrationFor(trope)?.id,trope.id);
});
test('unknown IDs, stale associations and arbitrary image URLs never invoke a category fallback',()=>{
 assert.equal(tropeArtDataUri({id:'unknown',label:'A Christmas wish',image_url:'https://evil.test/image',category:'seasonal'}),null);
 assert.equal(tropeArtDataUri({id:'meet-cute',label:'A Christmas wish',category:'cheese'}),null);
 assert.equal(tropeArtDataUri({id:'<script>',label:'<script>'}),null);
});
test('validator catches missing assignments, wrong associations, duplicate references and broken paths',async()=>{
 const registry=structuredClone(ILLUSTRATIONS);
 delete registry['old-flame'];
 registry['meet-cute'].label='wrong scene';
 registry['career-vs-love'].src=registry['return-home'].src;
 registry['coincidence'].src='illustrations/nonexistent.webp';
 const {errors}=await auditIllustrations({registry});
 for(const pattern of [/Missing assignment: old-flame/,/Incorrect association: meet-cute/,/Duplicate reference/,/Broken image: coincidence/])assert.ok(errors.some(e=>pattern.test(e)),pattern.toString());
});
test('image similarity check catches byte-different copies of the same visual',()=>{
 const a=Buffer.from(Array.from({length:72},(_,i)=>i%9*20));
 const b=Buffer.from(a.map(v=>v+2));
 assert.equal(hashDistance(differenceHash(a),differenceHash(b)),0);
 assert.equal(hashDistance(0n,0xffffn),16);
});
