import React,{useEffect,useRef,useState} from 'react';
import {roomRequest} from './services/rooms.js';
import {normalizeRoomCode,parseRoomInvite,roomInviteUrl} from './engine/roomInvites.mjs';
import {tropeArtDataUri} from './engine/tropeArt.mjs';
import {nextPlayerSnapshot} from './engine/roomState.mjs';
const KEY='romantiverse-room-v1';
const saved=()=>{try{return JSON.parse(sessionStorage.getItem(KEY))}catch{return null}};
export default function Multiplayer({movie,mode='classic'}){
const [session,setSession]=useState(saved),[room,setRoom]=useState(null),[card,setCard]=useState(null),[marks,setMarks]=useState([]),[revision,setRevision]=useState(0),[name,setName]=useState(''),[code,setCode]=useState(()=>parseRoomInvite(window.location.search)||''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[pending,setPending]=useState(false);
const active=useRef(false);
const latestSnapshot=useRef({revision:-1,marked:[]});
const incomingRoomCode=parseRoomInvite(window.location.search);
let inviteLink='';
try{if(session?.code)inviteLink=roomInviteUrl(window.location.href,session.code)}catch{}
async function copyInviteLink(){
 if(!inviteLink)return;
 const field=document.getElementById('room-invite-url');
 try{
  if(navigator.clipboard?.writeText&&window.isSecureContext){
   await navigator.clipboard.writeText(inviteLink);
   setError('Room invitation link copied. Each guest gets their own card.');
   return;
  }
 }catch{}
 // Android browsers and embedded webviews may deny Clipboard API access.
 // Keep a real, selectable room URL in the UI regardless of copy support.
 try{
  field?.focus();
  field?.select();
  field?.setSelectionRange(0,inviteLink.length);
  if(document.execCommand?.('copy')){
   setError('Room invitation link copied. Each guest gets their own card.');
   return;
  }
 }catch{}
 setError('Your invitation link is selected above. Long-press it to copy, or tap Share Invite.');
}
async function shareInviteLink(){
 if(!inviteLink)return;
 try{
  if(navigator.share){
   await navigator.share({title:'Romantiverse Bingo — '+(room?.movie_title||'Movie Night'),text:'Join my Romantiverse Bingo game!',url:inviteLink});
   return;
  }
 }catch(error){if(error?.name==='AbortError')return}
 await copyInviteLink();
}
const update=data=>{if(data.room)setRoom(data.room);if(data.card)setCard(data.card);const next=nextPlayerSnapshot(latestSnapshot.current,data);if(next!==latestSnapshot.current){latestSnapshot.current=next;setMarks(next.marked);setRevision(next.revision)}};
async function call(action,payload={}){setError('');setBusy(true);try{const data=await roomRequest({action,...payload,...(session?{code:session.code,token:session.token}:{})});update(data);if(['create','join'].includes(action)){const next={code:data.room.code,token:data.token,player_id:data.player_id};sessionStorage.setItem(KEY,JSON.stringify(next));setSession(next)}return data}catch(e){setError(e.message);return null}finally{setBusy(false)}}
useEffect(()=>{if(!session)return;let alive=true;const poll=async()=>{if(!alive||active.current)return;active.current=true;try{const data=await roomRequest({action:'state',code:session.code,token:session.token});if(alive){update(data);setError('')}}catch(e){if(alive)setError('Connection interrupted: '+e.message)}finally{active.current=false}};poll();const timer=setInterval(poll,3000);return()=>{alive=false;clearInterval(timer)}},[session?.code,session?.token]);
async function mark(index){if(pending||busy)return;setPending(true);try{const data=await roomRequest({action:'mark',code:session.code,token:session.token,index,revision});update(data);setError('')}catch(e){setError(e.message);try{update(await roomRequest({action:'state',code:session.code,token:session.token}))}catch{}}finally{setPending(false)}}
function leave(){sessionStorage.removeItem(KEY);latestSnapshot.current={revision:-1,marked:[]};setSession(null);setRoom(null);setCard(null);setMarks([]);setRevision(0);setError('')}
// The backend enforces host permissions; controls may be shown but unauthorized actions are rejected.
const myLines=(()=>{const set=new Set(marks);set.add(12);const lines=[...Array.from({length:5},(_,r)=>Array.from({length:5},(_,c)=>r*5+c)),...Array.from({length:5},(_,c)=>Array.from({length:5},(_,r)=>r*5+c)),[0,6,12,18,24],[4,8,12,16,20]];return lines.filter(l=>l.every(i=>set.has(i))).length})();
return <section className="panel multiplayer"><div className="eyebrow">LIVE MOVIE NIGHT</div><h2>Play Together</h2><p>No login, email, password or account. Pick a nickname, start a room or join with a seven-character code. Up to 12 players can use independent cards.</p>
<div className="room-movie-details" aria-label="Selected multiplayer movie"><small>SELECTED MOVIE</small><strong>{session?(room?.movie_title||'Loading room…'):(movie?.title||'Choose a movie in game setup')}</strong><span>Season: {session?(room?.season||'Loading…'):(movie?.season||'Not selected')}</span><span>Game mode: {session?(room?.mode||mode):mode}</span></div>
{session&&incomingRoomCode&&incomingRoomCode!==session.code&&<p role="status" className="room-error">You opened an invitation to room {incomingRoomCode}, but this device is still connected to room {session.code}. Choose “Leave This Device” below, then join the invited room using the prefilled code.</p>}
{!session?<><label htmlFor="player-name">Your nickname</label><input id="player-name" maxLength="32" placeholder="Movie-night nickname" value={name} onChange={e=>setName(e.target.value)}/><div className="room-join"><button className="primary" disabled={!name.trim()||!movie?.title||busy} onClick={()=>call('create',{name,movie_title:movie.title,season:movie.season,mode})}>Create Room for {movie?.title||'Selected Movie'}</button><input aria-label="Room code" aria-describedby="room-code-help" placeholder="Room code" maxLength="7" inputMode="text" autoCapitalize="characters" autoCorrect="off" spellCheck={false} value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/><button disabled={!name.trim()||!normalizeRoomCode(code)||busy} onClick={()=>call('join',{name,code:normalizeRoomCode(code)})}>Join Room</button></div><p className="fineprint" id="room-code-help">Room codes use seven letters or digits 2–9 (never 0 or 1).</p><p className="fineprint">Creating a room uses the selected movie and mode from your game setup. Sessions last up to 12 hours. Keep your join code private.</p></>:<><div className="room-header"><div><small>YOUR ROOM CODE</small><strong>{session.code}</strong></div><button onClick={()=>navigator.clipboard?.writeText(session.code).then(()=>setError('Room code copied.')).catch(()=>setError('Copy unavailable.'))}>Copy Code</button><button onClick={leave}>Leave This Device</button></div>{inviteLink&&<div className="room-invite"><label htmlFor="room-invite-url">Invite friends with a direct link</label><div className="room-invite-controls"><input id="room-invite-url" aria-label="Room invitation link" readOnly value={inviteLink} onFocus={e=>e.target.select()}/><button type="button" onClick={copyInviteLink}>Copy Invite Link</button><button type="button" onClick={shareInviteLink}>Share Invite</button></div><p className="fineprint">The link contains only the room code, not your private session token. Guests choose their own nickname and receive independent cards.</p></div>}<p><strong>{room?.movie_title||'Loading room…'}</strong> · {room?.status||'connecting'}</p><div className="player-list">{room?.players?.map(p=><div key={p.id}><strong>{p.name}{p.id===session.player_id?' (you)':''}</strong><span>{p.lines} lines · {p.marked} marked</span></div>)}</div>{room?.status==='lobby'&&<><p>Everyone joins before the host starts the movie.</p><button className="primary" disabled={busy} onClick={()=>call('start')}>Start Movie (host only)</button></>}{card&&<><div className="board live-board" role="group" aria-label="Multiplayer Bingo card" aria-busy={pending}>{'BINGO'.split('').map((l,i)=><div className="letter" key={'letter-'+i}>{l}</div>)}{card.map((t,i)=>{const marked=i===12||marks.includes(i);return <button key={i} className={'square '+(marked?'marked':'')} aria-label={'BINGO'[i%5]+(Math.floor(i/5)+1)+': '+t.label+(i===12?' (free center square)':'')} aria-pressed={marked} aria-disabled={pending||room?.status!=='playing'||i===12} disabled={room?.status!=='playing'||i===12} onClick={()=>mark(i)} title={t.reason||t.label}><img className="square-art" src={tropeArtDataUri(t)} alt="" aria-hidden="true" decoding="async"/><span className="square-label">{t.label}</span>{marked&&<b aria-hidden="true">✦</b>}</button>})}</div><p className="fineprint">{myLines} completed lines. Marks are saved on the server and restored after reconnection.</p></>}{room?.status==='playing'&&<button disabled={busy} onClick={()=>call('finish')}>Finish Movie (host only)</button>}{room?.status==='finished'&&<p>Movie night complete. Results are preserved until the room expires.</p>}</>}
{error&&<p role="status" className="room-error">{error}</p>}<p className="fineprint">Early-access guest multiplayer: no account needed, no chat, and no verified scene detection. A room token is stored in this browser session. Avoid sharing the token itself.</p></section>}
