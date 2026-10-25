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
 if(!title||title.length>250||!SEASONS.has(payload.movie.season))return null;
 return {movie:{title,season:payload.movie.season},free:Boolean(payload.free),mode:MODES.has(payload.mode)?payload.mode:'classic',difficulty:DIFFICULTIES.has(payload.difficulty)?payload.difficulty:'balanced',ratio:clampRatio(payload.ratio)};
}
export function encodeInvitation(game){
 const safe=normalize(game);
 if(!safe)throw Error('Cannot share an invalid movie');
 return encodeBase64Url(JSON.stringify({v:2,...safe}));
}
export function parseInvitation(hash){
 const match=/^#(invite|card)=([A-Za-z0-9_-]+)$/.exec(String(hash||''));
 if(!match)return null;
 const [,kind,encoded]=match;
 if(encoded.length>(kind==='card'?16000:3000))return null;
 try{
  const payload=JSON.parse(decodeBase64Url(encoded));
  if(payload.v!==(kind==='card'?1:2))return null;
  // Old #card links contained the sender's 25 squares. Ignore them and deal a new card.
  return normalize(payload);
 }catch{return null}
}
