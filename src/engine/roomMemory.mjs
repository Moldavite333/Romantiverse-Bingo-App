import {nextRoomState} from './roomState.mjs';
export const ROOM_KEY='romantiverse-room-v1',ROOM_HISTORY_KEY='romantiverse-room-history-v1';
const parse=(storage,key)=>{try{return JSON.parse(storage?.getItem(key)||'null')}catch{return null}};
const put=(storage,key,value)=>{try{storage?.setItem(key,JSON.stringify(value));return !!storage}catch{return false}};
export function roomCredentials(value){return value&&/^[A-Z2-9]{7}$/.test(value.code)&&typeof value.token==='string'&&value.token.length>0&&value.token.length<=1024&&typeof value.player_id==='string'&&value.player_id?{code:value.code,token:value.token,player_id:value.player_id}:null}
export function browserRoomStorage(){let tab=null,device=null;try{tab=globalThis.sessionStorage}catch{}try{device=globalThis.localStorage}catch{}return {tab,device}}
export function rememberedRooms(storage=browserRoomStorage()){
 const rows=parse(storage.device,ROOM_HISTORY_KEY);
 return (Array.isArray(rows)?rows:[]).filter(r=>roomCredentials(r)&&r.room?.code===r.code&&typeof r.room.movie_title==='string'&&Array.isArray(r.card)&&r.card.length===25&&r.card.every(t=>t&&typeof t.id==='string'&&typeof t.label==='string')&&Number.isInteger(r.revision)&&r.revision>=0&&Array.isArray(r.marked)&&r.marked.every(i=>Number.isInteger(i)&&i>=0&&i<25)).slice(0,5);
}
export function readActiveRoom(storage=browserRoomStorage()){
 const credentials=roomCredentials(parse(storage.tab,ROOM_KEY))||roomCredentials(parse(storage.device,ROOM_KEY));
 if(!credentials)return null;
 const record=rememberedRooms(storage).find(r=>r.code===credentials.code&&r.player_id===credentials.player_id&&r.token===credentials.token);
 return {...record,...credentials};
}
export function rememberRoom(session,snapshot={},storage=browserRoomStorage(),{activate=true}={}){
 const credentials=roomCredentials(session);if(!credentials)return false;
 if(activate||!roomCredentials(parse(storage.tab,ROOM_KEY)))put(storage.tab,ROOM_KEY,credentials);
 const device=activate||!roomCredentials(parse(storage.device,ROOM_KEY))?put(storage.device,ROOM_KEY,credentials):true;
 let snapshotSaved=true;
 if(snapshot.room?.code===credentials.code&&Array.isArray(snapshot.card)&&snapshot.card.length===25&&Number.isInteger(snapshot.revision)&&snapshot.revision>=0&&Array.isArray(snapshot.marked)&&snapshot.marked.every(i=>Number.isInteger(i)&&i>=0&&i<25)){
  const previous=rememberedRooms(storage),old=previous.find(r=>r.code===credentials.code&&r.player_id===credentials.player_id);
  // A delayed response or second window must not replace newer confirmed marks.
  if(!old||snapshot.revision>=old.revision){
   const record={...credentials,room:nextRoomState(old?.room,snapshot.room),card:snapshot.card,marked:[...new Set(snapshot.marked)],revision:snapshot.revision,savedAt:new Date().toISOString()};
   snapshotSaved=put(storage.device,ROOM_HISTORY_KEY,[record,...previous.filter(r=>r.code!==record.code||r.player_id!==record.player_id)].slice(0,5));
  }
 }
 return device&&snapshotSaved;
}
export function forgetRoom(session,storage=browserRoomStorage()){
 for(const store of [storage.tab,storage.device])try{const active=parse(store,ROOM_KEY);if(active?.code===session?.code&&active?.player_id===session?.player_id)store?.removeItem(ROOM_KEY)}catch{}
 put(storage.device,ROOM_HISTORY_KEY,rememberedRooms(storage).filter(r=>r.code!==session?.code||r.player_id!==session?.player_id));
}
export function initialGameTab({roomInvite,search,game,storage=browserRoomStorage()}={}){
 if(roomInvite)return 'together';if(search)return 'discover';
 let last;try{last=storage.tab?.getItem('romantiverse-last-tab')||storage.device?.getItem('romantiverse-last-tab')}catch{}
 if(readActiveRoom(storage)&&(last==='together'||!last))return 'together';
 if(game&&(last==='play'||!last))return 'play';
 return 'discover';
}
