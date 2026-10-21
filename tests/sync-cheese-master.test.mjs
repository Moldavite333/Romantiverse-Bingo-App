import test from 'node:test';import assert from 'node:assert/strict';
import {extractConceptRules} from '../scripts/sync-cheese-master.mjs';
test('extracts pure regex rules and refuses executable upstream code',()=>{
 const src='const CM_CONCEPTS = {\n  homecoming:/home/,\n  old_flame:/flame/,\n  career:/career/\n};\nfunction cmConceptSet(text){}';
 const result=extractConceptRules(src);assert.match(result,/export const CM_CONCEPTS/);assert.match(result,/recognizeCheeseConcepts/);
 assert.throws(()=>extractConceptRules(src.replace('career:/career/','career:fetch(\'secret\')')),/Unexpected/);
 assert.throws(()=>extractConceptRules('const bad = {}'),/missing or changed/);
});
