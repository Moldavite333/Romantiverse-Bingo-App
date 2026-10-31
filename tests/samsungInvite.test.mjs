import test from 'node:test';
import assert from 'node:assert/strict';
import {copyRoomInvite,shareRoomInvite,roomInviteMessage} from '../src/engine/shareRoomInvite.mjs';
import {roomInviteUrl,parseRoomInvite} from '../src/engine/roomInvites.mjs';
const base='https://bingo.cheeselouisepod.com/';
const url=roomInviteUrl(base+'?old=secret#fragment','ABC2DEF');
function field(value=url){
 const events=[];
 return {value,events,focus(){events.push('focus')},select(){events.push('select')},setSelectionRange(a,b){events.push('range:'+a+':'+b)}};
}
test('unique room invitation strips unrelated query/hash and never contains a player token',()=>{
 const invite=new URL(url);
 assert.equal(invite.origin,'https://bingo.cheeselouisepod.com');
 assert.equal(invite.pathname,'/');
 assert.equal(invite.search,'?room=ABC2DEF');
 assert.equal(invite.hash,'');
 assert.equal(parseRoomInvite(invite.search),'ABC2DEF');
});
test('Samsung starts modern and legacy copy under the same click even when modern denies',async()=>{
 const input=field();let legacy=0;let modern=0;
 const doc={execCommand(command){assert.equal(command,'copy');legacy++;return true}};
 const nav={clipboard:{async writeText(){modern++;throw Error('blocked')}}};
 assert.equal(await copyRoomInvite(url,{doc,nav,input}),'copied');
 assert.equal(legacy,1);assert.equal(modern,1);
 assert.ok(input.events.includes('select'));
});

test('Samsung starts both copy methods before waiting on permission',async()=>{
 const events=[];let resolveModern;
 const nav={clipboard:{writeText(v){events.push('modern');assert.equal(v,url);return new Promise(resolve=>{resolveModern=resolve})}}};
 const doc={execCommand(command){events.push('legacy');assert.equal(command,'copy');return false}};
 const input={value:url,focus(){events.push('focus')},select(){events.push('select')},setSelectionRange(){}};
 const pending=copyRoomInvite(url,{doc,nav,input});
 assert.deepEqual(events.slice(0,3),['modern','focus','select']);
 assert.ok(events.includes('legacy'));
 resolveModern();
 assert.equal(await pending,'copied');
});
test('Samsung legacy success remains a fallback when modern clipboard is denied',async()=>{
 const doc={execCommand(){return true}};
 const nav={clipboard:{writeText(){return Promise.reject(Error('permission denied'))}}};
 assert.equal(await copyRoomInvite(url,{doc,nav,input:field()}),'copied');
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
 assert.equal(await shareRoomInvite(url,'Autumn Dreams',{nav,collection:'Fall',theme:'Fall'}),'shared');
 assert.match(shared.text,/Autumn Dreams/);
 assert.match(shared.text,/Fall collection/);
 assert.match(shared.text,/Bingo theme: Fall/);
 assert.ok(shared.text.includes(url));
 assert.ok(shared.text.includes('Brought to you by the Cheese Louise Podcast'));
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
 assert.doesNotMatch(message,/Bingo theme:/);
});
test('reject javascript scheme links',async()=>{
 await assert.rejects(()=>copyRoomInvite('javascript:alert(1)'),/Invalid invitation link/);
});

test('host theme is stated without inventing a movie collection',()=>{
 const message=roomInviteMessage(url,'Unknown Film','Unspecified','Christmas');
 assert.match(message,/Bingo theme: Christmas/);
 assert.doesNotMatch(message,/Christmas collection/);
 assert.match(message,/Brought to you by the Cheese Louise Podcast/);
});
test('unsupported room theme is never represented as verified',()=>{
 const message=roomInviteMessage(url,'Unknown Film','Unspecified','Unverified');
 assert.doesNotMatch(message,/Bingo theme:/);
});
