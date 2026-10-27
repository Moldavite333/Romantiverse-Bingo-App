import test from 'node:test';
import assert from 'node:assert/strict';
import {copyRoomInvite,shareRoomInvite} from '../src/engine/shareRoomInvite.mjs';
import {roomInviteUrl,parseRoomInvite} from '../src/engine/roomInvites.mjs';
const base='https://moldavite333.github.io/Romantiverse-Bingo-App/';
const link=roomInviteUrl(base+'?junk=1#old','AB7K2XY');
test('unique invitation uses correct Pages path, only room code and no session token',()=>{
 const url=new URL(link);
 assert.equal(url.origin,'https://moldavite333.github.io');
 assert.equal(url.pathname,'/Romantiverse-Bingo-App/');
 assert.equal(url.search,'?room=AB7K2XY');
 assert.equal(url.hash,'');
 assert.equal(parseRoomInvite(url.search),'AB7K2XY');
 assert.equal(roomInviteUrl(base,'AB7K2XZ')===link,false);
 assert.ok(!link.includes('token'));
});
test('modern clipboard writes full URL',async()=>{
 let value='';
 assert.equal(await copyRoomInvite(link,{nav:{clipboard:{writeText:async x=>{value=x}}}}),'copied');
 assert.equal(value,link);
});
test('Samsung clipboard denial falls back to selected input and legacy copy',async()=>{
 let selected=false;
 const input={focus(){},select(){selected=true},setSelectionRange(){}};
 const nav={clipboard:{writeText:async()=>{throw new Error('NotAllowedError')}}};
 assert.equal(await copyRoomInvite(link,{nav,doc:{execCommand:()=>true},input}),'copied');
 assert.equal(selected,true);
});
test('when both clipboard methods fail, return manual instead of false success',async()=>{
 let selected=false;
 const input={focus(){},select(){selected=true},setSelectionRange(){}};
 assert.equal(await copyRoomInvite(link,{nav:{clipboard:{writeText:async()=>{throw Error('blocked')}}},doc:{execCommand:()=>false},input}),'manual');
 assert.equal(selected,true);
});
test('Android Web Share carries full unique link and title',async()=>{
 let payload;
 const result=await shareRoomInvite(link,'Autumn Dreams',{nav:{share:async p=>{payload=p}}});
 assert.equal(result,'shared');
 assert.equal(payload.url,link);
 assert.match(payload.text,/Autumn Dreams|Romantiverse Bingo/);
 assert.ok(payload.text.includes(link));
});
test('Web Share denied falls back to copying',async()=>{
 let copied;
 const nav={share:async()=>{throw Error('NotAllowedError')},clipboard:{writeText:async x=>{copied=x}}};
 assert.equal(await shareRoomInvite(link,'Autumn Dreams',{nav}),'copied');
 assert.equal(copied,link);
});
test('user cancellation does not claim a share',async()=>{
 assert.equal(await shareRoomInvite(link,'Autumn Dreams',{nav:{share:async()=>{const e=Error('cancelled');e.name='AbortError';throw e}}}),'cancelled');
});
