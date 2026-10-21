import test from 'node:test';import assert from 'node:assert/strict';
import {validateCheesePackage,buildSharedCheeseSuggestions} from '../src/engine/sharedCheese.mjs';
import {buildCard} from '../src/engine/intelligence.mjs';
test('sanitizes imported package and rejects unknown tags',()=>{
 const input={format:'cheese-louise-bingo-v1',traits:[{id:'old-flame',label:'Old flame returns',points:4,secret:'never export'}],movies:[{id:'one',title:'Autumn Love',season:'Fall',synopsis:'should never leave import',notes:'private',story_facts:{relationship:['former_sweethearts','private prose']},cheese_trait_ids:['old-flame','unknown']}]};
 const pkg=validateCheesePackage(input);assert.equal(pkg.movies[0].story_facts.relationship[0],'former_sweethearts');assert.equal(pkg.movies[0].cheese_trait_ids.length,1);assert.ok(!JSON.stringify(pkg).includes('should never leave'));assert.ok(!JSON.stringify(pkg).includes('private prose'));assert.ok(!JSON.stringify(pkg).includes('never export'));
 const editorial=buildSharedCheeseSuggestions(pkg.movies[0],pkg.traits);assert.equal(editorial[0].category,'cheese');assert.equal(editorial[0].verified,false);
 const card=buildCard(pkg.movies[0],{seed:22});assert.equal(card.length,25);
});
