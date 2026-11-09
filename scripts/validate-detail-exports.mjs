import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const entries=JSON.parse(await readFile('src/art/illustrations.json'));
const active=entries.filter(e=>e.active&&e.id!=='free'),hashes=new Set();let totalBytes=0,maxBytes=0;
for(const e of active){
 assert.equal(e.detailAsset,`illustrations/detail/${e.id}.webp`);
 const bytes=await readFile('public/'+e.detailAsset),meta=await sharp(bytes).metadata();
 assert.equal(meta.format,'webp');assert.equal(meta.width,768);assert.equal(meta.height,768);assert.ok(bytes.length<=260000);
 const hash=createHash('sha256').update(bytes).digest('hex');assert.equal(hash,e.detailSha256);assert.ok(!hashes.has(hash));hashes.add(hash);
 totalBytes+=bytes.length;maxBytes=Math.max(maxBytes,bytes.length);
}
assert.equal((await readdir('public/illustrations/detail')).filter(f=>f.endsWith('.webp')).length,active.length);
assert.equal(entries.find(e=>e.id==='free').detailAsset,undefined,'Approved emblem stays unchanged');
console.log(JSON.stringify({detailImages:active.length,pixels:768,totalBytes,maxBytes,missing:0,unique:hashes.size},null,2));
