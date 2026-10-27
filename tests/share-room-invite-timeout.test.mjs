import test from 'node:test';
import assert from 'node:assert/strict';
import {copyRoomInvite,shareRoomInvite,roomInviteMessage} from '../src/engine/shareRoomInvite.mjs';

const url='https://moldavite333.github.io/Romantiverse-Bingo-App/?room=W8LB8BE';
function legacyCopy(result=false){
 const input={value:url,focus(){},select(){},setSelectionRange(){}};
 const doc={execCommand(){return result}};
 return {input,doc};
}
test('Samsung clipboard permission never resolves: return manual fallback within deadline',async()=>{
 const {input,doc}=legacyCopy(false);
 const nav={clipboard:{writeText(){return new Promise(()=>{})}}};
 const started=Date.now();
 const outcome=await copyRoomInvite(url,{nav,doc,input,timeoutMs:30});
 assert.equal(outcome,'manual');
 assert.ok(Date.now()-started<900,'pending clipboard must not block indefinitely');
});
test('Legacy copy settles after a stalled modern permission prompt',async()=>{
 const {input,doc}=legacyCopy(true);
 const nav={clipboard:{writeText(){return new Promise(()=>{})}}};
 assert.equal(await copyRoomInvite(url,{nav,doc,input,timeoutMs:20}),'copied');
});
test('Modern clipboard success is preferred over a failed legacy copy',async()=>{
 const {input,doc}=legacyCopy(false);
 const nav={clipboard:{writeText(value){assert.equal(value,url);return Promise.resolve()}}};
 assert.equal(await copyRoomInvite(url,{nav,doc,input,timeoutMs:30}),'copied');
});
test('Rejected Android clipboard permission falls back to selectable text',async()=>{
 const {input,doc}=legacyCopy(false);
 const nav={clipboard:{writeText(){return Promise.reject(new Error('NotAllowedError'))}}};
 assert.equal(await copyRoomInvite(url,{nav,doc,input,timeoutMs:30}),'manual');
});
test('Native Android sharing includes the unique room URL and actual collection/theme',async()=>{
 let shared;
 const nav={share:async payload=>{shared=payload}};
 assert.equal(await shareRoomInvite(url,'Autumn Dreams',{nav,collection:'Fall',theme:'Fall'}),'shared');
 assert.equal(shared.url,url);
 assert.match(shared.text,/Autumn Dreams \(Fall collection\)/);
 assert.match(shared.text,/Bingo theme: Fall/);
 assert.match(shared.text,/Brought to you by Cheese Louise Podcast/);
});
test('Invitation does not manufacture a movie collection',()=>{
 const message=roomInviteMessage(url,'Unknown Title','Unspecified','Christmas');
 assert.doesNotMatch(message,/Christmas collection/);
 assert.match(message,/Bingo theme: Christmas/);
});
