// Share only public movie identity and game settings. Never share marks, private notes, or another player's squares.
const SEASONS=new Set(['Christmas','Fall','Horror']);
const MODES=new Set(['classic','chase','blackout','marathon']);
const DIFFICULTIES=new Set(['easy','balanced','hard']);
const clampRatio=n=>Number.isFinite(n)?Math.max(0,Math.min(100,n)):50;
function encodeBase64Url(text){
 const bytes=new TextEncoder().encode(text);
 let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
 return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function decodeBase64Url(encoded){
 const base64=encoded.replace(/-/g,'+').replace(/_/g,'/');
 const binary=atob(base64.padEnd(Math.ceil(base64.length/4)*4,'='));
 return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(binary,c=>c.charCodeAt(0)));
}
function normalize(payload){
 if(!payload||typeof payload!=='object'||!payload.movie||typeof payload.movie.title!=='string')return null;
 const title=payload.movie.title.trim();
 const movieSeason=payload.movie.season;
 // Public search titles can have an unknown season. Preserve that fact while
 // sharing the player's chosen card theme as a separate, non-evidence field.
 if(!title||title.length>250||(!SEASONS.has(movieSeason)&&movieSeason!=='Unspecified'))return null;
 const cardTheme=movieSeason==='Unspecified'?payload.cardTheme:movieSeason;
 if(!SEASONS.has(cardTheme))return null;
 return {movie:{title,season:movieSeason},...(movieSeason==='Unspecified'?{cardTheme}:{}),free:Boolean(payload.free),mode:MODES.has(payload.mode)?payload.mode:'classic',difficulty:DIFFICULTIES.has(payload.difficulty)?payload.difficulty:'balanced',ratio:clampRatio(payload.ratio)};
}
function freshInvitationId(){
 // Each share must produce a distinct invitation URL without exposing a player's card or progress.
 if(!globalThis.crypto?.getRandomValues)throw Error('Secure random invitations are unavailable');
 const bytes=new Uint8Array(16);
 globalThis.crypto.getRandomValues(bytes);
 return Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');
}
export function encodeInvitation(game){
 const safe=normalize(game);
 if(!safe)throw Error('Cannot share an invalid movie');
 return encodeBase64Url(JSON.stringify({v:3,invite_id:freshInvitationId(),...safe}));
}
export function parseInvitation(hash){
 const match=/^#(invite|card)=([A-Za-z0-9_-]+)$/.exec(String(hash||''));
 if(!match)return null;
 const [,kind,encoded]=match;
 if(encoded.length>(kind==='card'?16000:3000))return null;
 try{
  const payload=JSON.parse(decodeBase64Url(encoded));
  if(kind==='card'){
   if(payload.v!==1)return null;
  }else if(payload.v===3){
   if(typeof payload.invite_id!=='string'||!/^[a-f0-9]{32}$/.test(payload.invite_id))return null;
  }else if(payload.v!==2)return null;
  // Old #card links contained the sender's 25 squares. Ignore them and deal a new card.
  // V3 invite IDs make links unique but never affect the recipient's independently randomized card.
  return normalize(payload);
 }catch{return null}
}
