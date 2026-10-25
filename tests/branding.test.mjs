import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('standalone Bingo always uses the approved exact podcast attribution',()=>{
 const app=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
 const page=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const attribution='Brought to you by Cheese Louise Podcast';
 assert.ok(app.includes("const BRAND='"+attribution+"'"));
 assert.ok(page.includes(attribution));
 assert.ok(!app.includes('Brought to you by the Cheese Louise Podcast'));
 assert.ok(!page.includes('Brought to you by the Cheese Louise Podcast'));
});
