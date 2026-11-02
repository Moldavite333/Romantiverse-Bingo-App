import test from 'node:test';
import assert from 'node:assert/strict';
import {ROOM_KEY,ROOM_HISTORY_KEY,readActiveRoom,rememberRoom,rememberedRooms,forgetRoom,initialGameTab} from '../src/engine/roomMemory.mjs';
const store=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k),clear:()=>data.clear()}};
const session={code:'ABC2345',token:'private-player-token',player_id:'player-a'};
const snapshot={room:{code:session.code,movie_title:'Autumn Dreams',status:'playing'},card:Array.from({length:25},(_,i)=>({id:String(i),label:'Trope '+i})),marked:[0,4,12],revision:2};
test('a mobile tab discard or new window restores the same player, exact card and confirmed marks',()=>{
 const storage={tab:store(),device:store()};rememberRoom(session,snapshot,storage);storage.tab.clear();
 const saved=readActiveRoom(storage);assert.equal(saved.token,session.token);assert.deepEqual(saved.card,snapshot.card);assert.deepEqual(saved.marked,[0,4,12]);assert.equal(saved.revision,2);
 assert.equal(initialGameTab({storage}),'together');
});
test('existing per-tab room credentials migrate without creating another player',()=>{
 const storage={tab:store(),device:store()};storage.tab.setItem(ROOM_KEY,JSON.stringify(session));
 assert.deepEqual(readActiveRoom(storage),session);rememberRoom(session,snapshot,storage);storage.tab.clear();assert.equal(readActiveRoom(storage).player_id,'player-a');
});
test('late snapshots do not erase newer marks and separate room histories remain recoverable',()=>{
 const storage={tab:store(),device:store()};rememberRoom(session,snapshot,storage);rememberRoom(session,{...snapshot,revision:1,marked:[12]},storage);
 assert.deepEqual(readActiveRoom(storage).marked,snapshot.marked);
 const second={code:'DEF5678',token:'different-secret',player_id:'player-b'};rememberRoom(second,{...snapshot,room:{...snapshot.room,code:second.code}},storage);
 assert.equal(rememberedRooms(storage).length,2);
 rememberRoom(session,{...snapshot,revision:3},storage,{activate:false});assert.equal(readActiveRoom(storage).code,second.code,'A background window cannot steal the active room');
 rememberRoom(session,snapshot,storage);assert.equal(readActiveRoom(storage).code,session.code);
 forgetRoom(session,storage);assert.equal(readActiveRoom(storage),null);assert.equal(rememberedRooms(storage).length,1);
});
test('corrupt or unavailable storage never prevents the game from opening',()=>{
 const storage={tab:store(),device:store()};storage.tab.setItem(ROOM_KEY,'bad JSON');storage.device.setItem(ROOM_HISTORY_KEY,JSON.stringify([{...session,...snapshot,marked:'bad'}]));
 assert.equal(readActiveRoom(storage),null);assert.deepEqual(rememberedRooms(storage),[]);
 const blocked={getItem(){throw Error('blocked')},setItem(){throw Error('full')}};
 assert.doesNotThrow(()=>rememberRoom(session,snapshot,{tab:blocked,device:blocked}));assert.equal(initialGameTab({storage:{tab:blocked,device:blocked}}),'discover');
});
test('explicit invitations and movie searches retain precedence over the remembered game',()=>{
 const storage={tab:store(),device:store()};rememberRoom(session,snapshot,storage);
 assert.equal(initialGameTab({roomInvite:'DEF5678',storage}),'together');assert.equal(initialGameTab({search:'movie',storage}),'discover');
 storage.device.setItem('romantiverse-last-tab','discover');assert.equal(initialGameTab({storage}),'discover');
});

test('a full snapshot store reports failed saving even if small credentials still fit',()=>{
 const device=store(),set=device.setItem;device.setItem=(key,value)=>{if(key===ROOM_HISTORY_KEY)throw Error('full');set(key,value)};
 assert.equal(rememberRoom(session,snapshot,{tab:store(),device}),false);
});

test('a late same-revision poll cannot reopen a finished room in saved history',()=>{
 const storage={tab:store(),device:store()};rememberRoom(session,{...snapshot,room:{...snapshot.room,status:'finished'}},storage);
 rememberRoom(session,snapshot,storage,{activate:false});assert.equal(readActiveRoom(storage).room.status,'finished');
});
