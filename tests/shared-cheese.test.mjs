import test from 'node:test';import assert from 'node:assert/strict';
import {validateCheesePackage,buildSharedCheeseSuggestions,applyEditorialToCard} from '../src/engine/sharedCheese.mjs';
import {buildCard,visibleTropeKey} from '../src/engine/intelligence.mjs';
test('sanitizes imported package and rejects unknown tags',()=>{
 const input={format:'cheese-louise-bingo-v1',traits:[{id:'old-flame',label:'Old flame returns',points:4,secret:'never export'}],movies:[{id:'one',title:'Autumn Love',season:'Fall',synopsis:'should never leave import',notes:'private',story_facts:{relationship:['former_sweethearts','private prose']},cheese_trait_ids:['old-flame','unknown']}]};
 const pkg=validateCheesePackage(input);assert.equal(pkg.movies[0].story_facts.relationship[0],'former_sweethearts');assert.equal(pkg.movies[0].cheese_trait_ids.length,1);assert.ok(!JSON.stringify(pkg).includes('should never leave'));assert.ok(!JSON.stringify(pkg).includes('private prose'));assert.ok(!JSON.stringify(pkg).includes('never export'));
 const editorial=buildSharedCheeseSuggestions(pkg.movies[0],pkg.traits);assert.equal(editorial[0].category,'cheese');assert.equal(editorial[0].verified,false);
 const card=buildCard(pkg.movies[0],{seed:22});assert.equal(card.length,25);
});

test('retired hot-beverage traits cannot return through an imported Cheese Louise package',()=>{
 const input={format:'cheese-louise-bingo-v1',traits:[
  {id:'cozy-drink',label:'An emotionally significant hot beverage'},
  {id:'legacy-drink',label:' AN EMOTIONALLY SIGNIFICANT HOT BEVERAGE '},
  {id:'old-flame',label:'An old flame reappears'}
 ],movies:[{id:'one',title:'Autumn Love',season:'Fall',cheese_trait_ids:['cozy-drink','legacy-drink','old-flame']}]};
 const pkg=validateCheesePackage(input);
 const suggestions=buildSharedCheeseSuggestions(pkg.movies[0],pkg.traits);
 assert.deepEqual(suggestions.map(t=>t.id),['cl-old-flame']);
});

test('editorial overrides cannot duplicate an existing seasonal or cheese label',()=>{
 const card=buildCard({title:'Harvest Reunion',season:'Fall'},{seed:14});
 const cheeseIndex=card.findIndex(t=>t.category==='cheese');
 const other=card.find(t=>t.category==='seasonal');
 const suggestions=[
  {id:'editorial-duplicate',label:'  '+other.label.toUpperCase()+' ',category:'cheese'},
  {id:'editorial-new',label:'A completely new romance moment',category:'cheese'},
  {id:'editorial-new-again',label:'a completely new romance moment',category:'cheese'},
  {id:'editorial-another',label:'Another unique moment',category:'cheese'}
 ];
 const next=applyEditorialToCard(card,suggestions);
 assert.equal(next.length,25);
 assert.equal(new Set(next.map(visibleTropeKey)).size,25);
 assert.equal(next[cheeseIndex].label,'A completely new romance moment');
 assert.equal(card[cheeseIndex].id!==next[cheeseIndex].id,true);
 assert.equal(next.filter(t=>visibleTropeKey(t)==='a completely new romance moment').length,1);
});
test('editorial overrides keep valid cards when suggestions are exhausted',()=>{
 const card=buildCard({title:'Holiday Reunion',season:'Christmas'},{seed:17});
 const seasonal=card.find(t=>t.category==='seasonal');
 const result=applyEditorialToCard(card,[{id:'duplicate',label:seasonal.label,category:'cheese'}]);
 assert.deepEqual(result,card);
 assert.equal(new Set(result.map(visibleTropeKey)).size,25);
});
