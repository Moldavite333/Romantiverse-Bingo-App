import test from 'node:test';import assert from 'node:assert/strict';
import {extractStoryFacts,validateStoryFacts,factKeywords} from '../src/engine/storyFacts.mjs';
test('extracts original categorical facts without retaining source prose',()=>{
 const source='An attorney returns to her hometown and reunites with a childhood sweetheart at a harvest festival.';
 const facts=extractStoryFacts(source);
 assert.deepEqual(facts.setting,['hometown']);assert.ok(facts.relationship.includes('former_sweethearts'));
 assert.ok(facts.conflict.includes('career_choice'));assert.ok(facts.event.includes('festival'));
 assert.ok(!JSON.stringify(facts).includes('attorney returns'));
});
test('unknown tags and injected free text cannot enter catalog',()=>{
 const facts=validateStoryFacts({setting:['hometown','hometown','copyrighted paragraph'],event:['festival'],extra:['no']});
 assert.deepEqual(facts.setting,['hometown']);assert.deepEqual(facts.event,['festival']);
 assert.ok(factKeywords(facts).includes('hometown'));
 assert.throws(()=>validateStoryFacts({setting:'hometown'}),/Invalid/);
});
