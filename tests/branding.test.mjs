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


test('public game copy has one trope concept without exposing engine categories',()=>{
 const app=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
 assert.match(app,/Your card contains \{game\.card\.filter\(t=>t\.category!=='free'\)\.length\} tropes/);
 assert.match(app,/Every Bingo square is simply a trope to watch for/);
 assert.doesNotMatch(app,/Tropes: \{balance\(game\.card\)\./);
 assert.doesNotMatch(app,/\{t\.category==='cheese'\?'Trope':'Trope'\}/);
 assert.doesNotMatch(app,/Cheese Master recognition rules/);
 assert.doesNotMatch(app,/Rules of the Romantiverse/i);
 // Engine ratios and internal categories remain untouched for deterministic scoring.
 assert.match(app,/cheeseRatio:ratio\/100/);
});
