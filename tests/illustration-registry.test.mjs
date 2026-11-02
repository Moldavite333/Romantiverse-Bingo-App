import test from 'node:test';
import assert from 'node:assert/strict';
import {illustrationRegistry,resolveIllustration,requireIllustration} from '../src/engine/illustrationRegistry.mjs';
import {CHEESE,SEASONAL} from '../src/engine/intelligence.mjs';
import roomAliases from '../src/art/room-illustration-aliases.json' with {type:'json'};
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
test('all bundled active IDs and labels have individually briefed unique assignments',()=>{
 const required=[...CHEESE,...['Christmas','Fall'].flatMap(s=>SEASONAL[s].map((label,i)=>({id:`season-${s}-${i}`,label}))),{id:'free',label:'CHEESE LOUISE POD'}];
 const paths=new Set();
 for(const t of required){const e=illustrationRegistry[t.id];assert.equal(e.label,t.label);assert.ok(e.scene);assert.ok(e.asset);assert.ok(!paths.has(e.asset),t.id);paths.add(e.asset);}
 assert.equal(paths.size,90);
});
test('lookup uses IDs, supports deployment subpaths, and never infers art from labels',()=>{
 assert.equal(resolveIllustration({id:'coincidence',label:'  A coincidence  '},{base:'/bingo/'}).src,'/bingo/illustrations/coincidence.webp');
 const missing=[];assert.equal(resolveIllustration({id:'cl-external',label:'Unreviewed editorial trait'},{onMissing:e=>missing.push(e)}),null);
 assert.equal(missing[0].reason,'unregistered');assert.throws(()=>requireIllustration({id:'missing'}),/Missing dedicated illustration/);
 assert.ok(resolveIllustration({id:'season-Horror-0'}));
});
test('free center is a distinct branded asset and registry entries cannot mutate',()=>{
 assert.equal(illustrationRegistry.free.label,'CHEESE LOUISE POD');assert.notEqual(illustrationRegistry.free.asset,illustrationRegistry['season-Christmas-11'].asset);
 assert.throws(()=>{illustrationRegistry.free.asset='other.webp'},TypeError);
});
test('every authoritative room label resolves both old positional and stable IDs',()=>{
 const source=readFileSync(new URL('../supabase/functions/game-room/index.ts',import.meta.url),'utf8');
 const literal=re=>vm.runInNewContext('('+source.match(re)[1]+')',Object.create(null),{timeout:1000});
 const cheese=literal(/const cheese=(\[[^\n]*\]);/),themes=literal(/const themes=(\{[^\n]*\});/);
 for(const [group,labels] of Object.entries({cheese,...themes}))for(const [i,label] of labels.entries()){
  const stable='room-'+label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const legacy=(group==='cheese'?'cheese':'seasonal')+'-'+i;
  assert.ok(roomAliases[label],label);
  assert.equal(resolveIllustration({id:legacy,label}).id,roomAliases[label]);
  assert.equal(resolveIllustration({id:stable,label}).id,roomAliases[label]);
 }
 assert.equal(resolveIllustration({id:'seasonal-0',label:'Unknown imported label'}),null);
});
test('room deal assigns the same stable ID to a label across independent cards',()=>{
 const source=readFileSync(new URL('../supabase/functions/game-room/index.ts',import.meta.url),'utf8');
 const context={Deno:{env:{get:()=>''},serve:()=>{}},crypto:globalThis.crypto,URL,Request,Response,TextEncoder,Uint8Array,Uint32Array};
 vm.runInNewContext(source+'\nglobalThis.deal=card;',context);
 const ids=new Map();
 for(let i=0;i<30;i++)for(const t of context.deal('Christmas')){
  if(ids.has(t.label))assert.equal(t.id,ids.get(t.label));else ids.set(t.label,t.id);
  assert.ok(resolveIllustration(t),t.label);
 }
});
