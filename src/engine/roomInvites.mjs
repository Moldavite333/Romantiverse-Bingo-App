// A room invitation shares only the public join code. Never include the player's session token.
// Match the live game-room service: 0 and 1 are never valid join-code digits.
const ROOM_CODE=/^[A-Z2-9]{7}$/;
export function normalizeRoomCode(value){
 if(typeof value!=='string')return null;
 const code=value.trim().toUpperCase();
 return ROOM_CODE.test(code)?code:null;
}
export function parseRoomInvite(search){
 try{
  const params=new URLSearchParams(String(search||''));
  const codes=params.getAll('room');
  return codes.length===1?normalizeRoomCode(codes[0]):null;
 }catch{return null}
}
export function roomInviteUrl(href,code){
 const normalized=normalizeRoomCode(code);
 if(!normalized)throw Error('Invalid room code');
 const url=new URL(href);
 if(!['https:','http:'].includes(url.protocol))throw Error('Invalid invitation address');
 // Strip unrelated query parameters, old invitations, and any private state.
 url.search='';
 url.hash='';
 url.searchParams.set('room',normalized);
 return url.toString();
}
