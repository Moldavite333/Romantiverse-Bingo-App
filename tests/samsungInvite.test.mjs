import test from 'node:test';
import assert from 'node:assert/strict';
import {copyRoomInvite,shareRoomInvite,roomInviteMessage} from '../src/engine/shareRoomInvite.mjs';
import {roomInviteUrl,parseRoomInvite} from '../src/engine/roomInvites.mjs';
const base='https://moldavite333.github.io/Romantiverse-Bingo-App/';
const url=roomInviteUrl(base+'?old=secret#fragment','ABC2DEF');
function field(value=url){
 const events=[];
 return {value,events,focus(){events.push('focus')},select(){events.push('select')},setSelectionRange(a,b){events.push('range:'+a+':'+b)}};
}
test('unique room invitation strips unrelated query/hash and never contains a player token',()=>{
 const invite=new URL(url);
 assert.equal(invite.origin,'https://moldavite333.github.io');
 assert.equal(invite.pathname,'/Romantiverse-Bingo-App/');
 assert.equal(invite.search,'?room=ABC2DEF');
 assert.equal(invite.hash,'');
 assert.equal(parseRoomInvite(invite.search),'ABC2DEF');
});
test('Samsung legacy copy happens synchronously before a denied clipboard promise',async()=>{
 const input=field();let legacy=0;let modern=0;
 const doc={execCommand(command){assert.equal(command,'copy');legacy++;return true}};
 const nav={clipboard:{async writeText(){modern++;throw Error('blocked')}}};
 assert.equal(await copyRoomInvite(url,{doc,nav,input}),'copied');
 assert.equal(legacy,1);assert.equal(modern,0);
 assert.ok(input.events.includes('select'));
});
test('modern clipboard succeeds if legacy copying is blocked',async()=>{
 const input=field();let copied='';
 const doc={execCommand(){return false}};
 const nav={clipboard:{async writeText(v){copied=v}}};
 assert.equal(await copyRoomInvite(url,{doc,nav,input}),'copied');
 assert.equal(copied,url);
});
test('when all copying is denied, never claim success; leave text selected',async()=>{
 const input=field();const doc={execCommand(){throw Error('blocked')}};
 const nav={clipboard:{async writeText(){throw Error('denied')}}};
 assert.equal(await copyRoomInvite(url,{doc,nav,input}),'manual');
 assert.ok(input.events.filter(x=>x==='select').length>=2);
});
test('share text includes actual movie and collection plus public join URL',async()=>{
 let shared;
 const nav={async share(value){shared=value}};
 assert.equal(await shareRoomInvite(url,'Autumn Dreams',{nav,collection:'Fall'}),'shared');
 assert.match(shared.text,/Autumn Dreams/);
 assert.match(shared.text,/Fall collection/);
 assert.ok(shared.text.includes(url));
 assert.ok(shared.text.includes('Brought to you by Cheese Louise Podcast'));
 assert.equal(shared.url,url);
 assert.ok(!shared.text.includes('token='));
});
test('share cancellation does not falsely claim success or copy',async()=>{
 const nav={async share(){const e=Error('cancelled');e.name='AbortError';throw e}};
 assert.equal(await shareRoomInvite(url,'Autumn Dreams',{nav}),'cancelled');
});
test('share denial falls back to copying the public invitation',async()=>{
 let copied='';
 const nav={async share(){throw Error('denied')},clipboard:{async writeText(v){copied=v}}};
 assert.equal(await shareRoomInvite(url,'Autumn Dreams',{nav}),'copied');
 assert.equal(copied,url);
});
test('unverified collection stays unverified in invitation text',()=>{
 const message=roomInviteMessage(url,'Unknown Film','Unspecified');
 assert.match(message,/Unknown Film/);
 assert.doesNotMatch(message,/Unspecified collection/);
});
test('reject javascript scheme links',async()=>{
 await assert.rejects(()=>copyRoomInvite('javascript:alert(1)'),/Invalid invitation link/);
});
