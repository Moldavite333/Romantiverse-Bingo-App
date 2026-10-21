import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeMovie,inferSeason,buildCard,balance} from '../src/engine/intelligence.mjs';
test('recognizes contextual return-home clues without a paid model',()=>{const r=analyzeMovie({title:'Back to the Orchard',synopsis:'She returns to her hometown and reunites with a former sweetheart.',season:'Fall'});assert.equal(r.cheese.find(t=>t.id==='return-home').evidence,'synopsis');assert.equal(r.cheese.find(t=>t.id==='old-flame').evidence,'synopsis')});
test('does not mistake substring of executive for ex',()=>{const r=analyzeMovie({title:'Executive Christmas',synopsis:'An executive finds a new position',season:'Christmas'});assert.equal(r.cheese.find(t=>t.id==='rival').evidence,'prediction')});
test('infer season from movie text when not specified',()=>assert.equal(inferSeason({title:'The Pumpkin Harvest',synopsis:'Autumn apple cider at the orchard'}),'Fall'));
test('all suggestions are labeled unverified',()=>{const r=analyzeMovie({title:'Christmas Love',season:'Christmas'});assert.equal(r.generativeAI,false);assert.equal(r.verifiedScenes,false);assert.ok([...r.cheese,...r.seasonal].every(t=>t.verified===false))});
test('offline cards maintain balanced ratio and determinism',()=>{const movie={title:'Pumpkin Pie Wars',season:'Fall',synopsis:'A bakery contest at a fall festival'};const a=buildCard(movie,{seed:87});assert.deepEqual(a,buildCard(movie,{seed:87}));assert.deepEqual(balance(a),{cheese:12,seasonal:12,total:24})});
