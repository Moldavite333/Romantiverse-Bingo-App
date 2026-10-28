import React,{useEffect,useMemo,useRef,useState} from 'react';
import {roomRequest} from './services/rooms.js';
import {searchCatalog} from './services/catalog.js';
import {searchPublicMovies} from './services/movieSearch.js';
import {mergeMovieListings} from './engine/movieListings.mjs';
import {approvedMoviePoster} from './engine/posters.mjs';
import {copyRoomInvite,shareRoomInvite,roomInviteMessage} from './engine/shareRoomInvite.mjs';
import {normalizeRoomCode,parseRoomInvite,roomInviteUrl} from './engine/roomInvites.mjs';
import {tropeArtDataUri} from './engine/tropeArt.mjs';
import {nextPlayerSnapshot} from './engine/roomState.mjs';
import {winningLines} from './engine/bingo.mjs';
const KEY='romantiverse-room-v1';
const saved=()=>{try{return JSON.parse(sessionStorage.getItem(KEY))}catch{return null}};
const THEMES=['Romance','Christmas','Fall','Horror'];
function MovieDetails({movie,theme,heading='TONIGHT’S MOVIE'}){
 if(!movie)return null;
 const title=movie.movie_title||movie.title;
 const poster=approvedMoviePoster(movie);
 const collection=movie.movie_collection||movie.season||'Unspecified';
 return <div className="room-movie-details" aria-label="Selected multiplayer movie">
  {poster?<img className="room-movie-poster" src={poster.url} alt={title+' movie poster'} referrerPolicy="no-referrer" decoding="async" onError={e=>{e.currentTarget.hidden=true}}/>:<div className="room-movie-placeholder" aria-hidden="true">🎬</div>}
  <div className="room-movie-copy"><small>{heading}</small><strong>{title}</strong>{Number.isInteger(movie.release_year)&&<span>{movie.release_year}</span>}
   <span>Collection: {collection==='Unspecified'?'Unverified':collection}</span><span>Bingo theme: {theme||'Romance'}</span>
  </div></div>;
}
export default function Multiplayer({catalog=[],mode='classic'}){
const [session,setSession]=useState(saved),[room,setRoom]=useState(null),[card,setCard]=useState(null),[marks,setMarks]=useState([]),[revision,setRevision]=useState(0),[name,setName]=useState(''),[code,setCode]=useState(()=>parseRoomInvite(window.location.search)||''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[pending,setPending]=useState(false);
const [selected,setSelected]=useState(null),[theme,setTheme]=useState('Romance'),[hostMode,setHostMode]=useState(mode);
const [search,setSearch]=useState(''),[remoteMovies,setRemoteMovies]=useState([]),[searching,setSearching]=useState(false),[preview,setPreview]=useState(null),[notice,setNotice]=useState(''),[manualInvite,setManualInvite]=useState(false);
const inviteInput=useRef(null);
const active=useRef(false);
const chosen=selected?mergeMovieListings([[selected],catalog,remoteMovies])[0]:null;
const choices=useMemo(()=>mergeMovieListings([catalog,remoteMovies]).filter(m=>(m.title+' '+(m.release_year||'')).toLowerCase().includes(search.trim().toLowerCase())).slice(0,12),[catalog,remoteMovies,search]);
function selectMovie(m){setSelected(m);setTheme(THEMES.includes(m.season)?m.season:'Romance');setSearch(m.title);setError('')}
useEffect(()=>{
 const term=search.trim();
 if(term.length<3){setRemoteMovies([]);setSearching(false);return}
 const ctrl=new AbortController();setSearching(true);
 const timer=setTimeout(()=>Promise.allSettled([searchCatalog(term,{limit:35,signal:ctrl.signal}),searchPublicMovies(term,{signal:ctrl.signal})]).then(results=>{
  if(ctrl.signal.aborted)return;
  setRemoteMovies(mergeMovieListings([results[0].status==='fulfilled'?results[0].value.items:[],results[1].status==='fulfilled'?results[1].value:[]]));
 }).finally(()=>{if(!ctrl.signal.aborted)setSearching(false)}),350);
 return()=>{clearTimeout(timer);ctrl.abort()};
},[search]);
useEffect(()=>{
 if(session){setPreview(null);return}
 const normalized=normalizeRoomCode(code);if(!normalized){setPreview(null);return}
 let alive=true;const timer=setTimeout(()=>roomRequest({action:'preview',code:normalized}).then(data=>{if(alive)setPreview(data.room||null)}).catch(()=>{if(alive)setPreview(null)}),250);
 return()=>{alive=false;clearTimeout(timer)};
},[session?.code,code]);
const latestSnapshot=useRef({revision:-1,marked:[]});
const incomingRoomCode=parseRoomInvite(window.location.search);
let inviteLink='';
try{if(session?.code)inviteLink=roomInviteUrl(window.location.href,session.code)}catch{}
const invitationText=inviteLink?roomInviteMessage(inviteLink,room?.movie_title||'Movie Night',room?.movie_collection||'Unspecified',room?.season||''):'';
async function copyInviteLink(){
 if(!inviteLink)return;
 // Android may leave navigator.clipboard.writeText pending while permission UI
 // is open. Expose a selectable invitation immediately, before any await.
 setManualInvite(true);
 setNotice('Copying link… If Android blocks it, long-press the invitation text below or use Share Invite.');
 try{
  const result=await copyRoomInvite(inviteLink,{input:inviteInput.current});
  setNotice(result==='copied'?'Copy attempted. Paste the link to confirm; if it is missing, use Share Invite or the ready-to-send text below.':'Clipboard blocked. Use Share Invite, or long-press the ready-to-send text below.');
 }catch{setError('Copy unavailable. Use Share Invite or long-press the invitation text below.')}
}
async function shareInviteLink(){
 if(!inviteLink)return;
 // Android's native share sheet may hang without resolving. Keep the complete
 // invitation selectable immediately, even while the share promise is pending.
 setManualInvite(true);
 setNotice('Opening sharing… If Android stalls, long-press the invitation text below.');
 try{const result=await shareRoomInvite(inviteLink,room?.movie_title||'Movie Night',{input:inviteInput.current,collection:room?.movie_collection||'Unspecified',theme:room?.season||''});
  if(result==='shared')setNotice('Android sharing opened.');
  if(result==='cancelled')setNotice('Sharing cancelled. Your invitation link remains available below.');
  if(result==='copied'){setManualInvite(true);setNotice('Copy attempted. Paste to confirm, or use the invitation text below.');}
  if(result==='manual'){setManualInvite(true);setNotice('Sharing and copying are unavailable here. Long-press the invitation text below to copy it.');}
 }catch{setError('Share unavailable. Long-press the link to copy it.')}
}
const update=data=>{if(data.room)setRoom(data.room);if(data.card)setCard(data.card);const next=nextPlayerSnapshot(latestSnapshot.current,data);if(next!==latestSnapshot.current){latestSnapshot.current=next;setMarks(next.marked);setRevision(next.revision)}};
async function call(action,payload={}){setError('');setBusy(true);try{const data=await roomRequest({action,...payload,...(session?{code:session.code,token:session.token}:{})});update(data);if(['create','join'].includes(action)){const next={code:data.room.code,token:data.token,player_id:data.player_id};sessionStorage.setItem(KEY,JSON.stringify(next));setSession(next)}return data}catch(e){setError(e.message);return null}finally{setBusy(false)}}
useEffect(()=>{if(!session)return;let alive=true;const poll=async()=>{if(!alive||active.current)return;active.current=true;try{const data=await roomRequest({action:'state',code:session.code,token:session.token});if(alive){update(data);setError('')}}catch(e){if(alive)setError('Connection interrupted: '+e.message)}finally{active.current=false}};poll();const timer=setInterval(poll,3000);return()=>{alive=false;clearInterval(timer)}},[session?.code,session?.token]);
async function mark(index){if(pending||busy)return;setPending(true);try{const data=await roomRequest({action:'mark',code:session.code,token:session.token,index,revision});update(data);setError('')}catch(e){setError(e.message);try{update(await roomRequest({action:'state',code:session.code,token:session.token}))}catch{}}finally{setPending(false)}}
function leave(){try{sessionStorage.removeItem(KEY)}catch{};latestSnapshot.current={revision:-1,marked:[]};setSession(null);setRoom(null);setCard(null);setMarks([]);setRevision(0);setError('');setNotice('');setManualInvite(false)}
// The backend enforces host permissions; controls may be shown but unauthorized actions are rejected.
const completedLines=winningLines(marks,true);
const myLines=completedLines.length;
const winningIndices=new Set(completedLines.flat());
const celebrate=room?.mode==='blackout'?marks.length===25:myLines>0;
const joinForm=<section className="room-join-panel" aria-label="Join a game"><h3>{incomingRoomCode?"You've been invited to play!":'Join a Game'}</h3>
  {preview&&<MovieDetails movie={preview} theme={preview.season} heading="YOU'RE INVITED TO WATCH"/>}
  <label htmlFor="join-nickname">Your nickname</label><input id="join-nickname" maxLength="32" placeholder="Your nickname" value={name} onChange={e=>setName(e.target.value)}/>
  <label htmlFor="join-code">Room code</label><div className="room-join"><input id="join-code" aria-label="Room code" placeholder="Seven-character code" maxLength="7" inputMode="text" autoCapitalize="characters" autoCorrect="off" spellCheck={false} value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/><button className="primary" disabled={!name.trim()||!normalizeRoomCode(code)||busy} onClick={()=>call('join',{name:name.trim(),code:normalizeRoomCode(code)})}>Join Game</button></div>
  <p className="fineprint">Enter a nickname to enable Join Game. Your invitation fills in the code automatically. You do not need to select a movie.</p>
 </section>;
const hostForm=<section className="room-host-panel" aria-label="Host a game"><h3>Host a Game</h3>
  <p>Pick the movie and Bingo theme here. Everyone joining automatically sees the same movie and collection.</p>
  <label htmlFor="host-nickname">Your nickname</label><input id="host-nickname" maxLength="32" placeholder="Your nickname" value={name} onChange={e=>setName(e.target.value)}/>
  <label htmlFor="host-movie-search">Choose your movie</label><input id="host-movie-search" placeholder="Search movie catalog…" value={search} onChange={e=>{setSearch(e.target.value);setSelected(null)}}/>
  {searching&&<p className="fineprint" role="status">Searching more movies…</p>}
  {!selected&&search.trim()&&<div className="room-movie-options" role="group" aria-label="Choose movie">{choices.map(m=><button type="button" key={m.id||m.title+'-'+m.release_year} onClick={()=>selectMovie(m)}><strong>{m.title}</strong><span>{Number.isInteger(m.release_year)?m.release_year+' · ':''}{m.season==='Unspecified'?'Collection unverified':m.season}</span></button>)}
   {!searching&&search.trim().length>=3&&<button type="button" onClick={()=>selectMovie({id:'custom-'+search.trim(),title:search.trim(),season:'Unspecified',kind:'CUSTOM · TITLE UNVERIFIED'})}>Use “{search.trim()}” as an unverified title</button>}
  </div>}
  {chosen&&<><MovieDetails movie={chosen} theme={theme} heading="SELECTED MOVIE"/><button type="button" onClick={()=>{setSelected(null);setSearch('')}}>Change Movie</button></>}
  <label htmlFor="host-theme">Bingo card theme</label><select id="host-theme" value={theme} onChange={e=>setTheme(e.target.value)}>{THEMES.map(t=><option key={t}>{t}</option>)}</select>
  <p className="fineprint">The Bingo theme does not change the movie's actual catalog collection. Unverified titles remain labeled unverified.</p>
  <label htmlFor="host-mode">Game mode</label><select id="host-mode" value={hostMode} onChange={e=>setHostMode(e.target.value)}><option value="classic">Classic Bingo</option><option value="chase">Cheese Chase</option><option value="blackout">Blackout</option><option value="marathon">Movie Marathon</option></select>
  <button className="primary room-create-button" disabled={!name.trim()||!chosen?.title||busy} onClick={()=>call('create',{name:name.trim(),movie_title:chosen.title,movie_collection:chosen.season||'Unspecified',poster_url:approvedMoviePoster(chosen)?.url||null,release_year:Number.isInteger(chosen.release_year)?chosen.release_year:null,season:theme,mode:hostMode})}>Create Room</button>
 </section>;
return <section className="panel multiplayer"><div className="eyebrow">LIVE MOVIE NIGHT</div><h2>Play Together</h2>
<p>No accounts or passwords. The host chooses the movie and Bingo theme; guests enter a nickname and receive their own randomized cards.</p>
{session?<>
 {incomingRoomCode&&incomingRoomCode!==session.code&&<p role="status" className="room-error">This device is still in room {session.code}. <button type="button" onClick={leave}>Switch to invited room {incomingRoomCode}</button></p>}
 <MovieDetails movie={room} theme={room?.season} heading="YOUR SHARED MOVIE"/>
 <div className="room-header"><div><small>YOUR ROOM CODE</small><strong>{session.code}</strong></div><button onClick={leave}>Leave This Device</button></div>
 {inviteLink&&<div className="room-invite"><label htmlFor="room-invite-url">Invite friends with this unique room link</label>
  <input ref={inviteInput} id="room-invite-url" aria-label="Room invitation link" readOnly value={inviteLink} onFocus={e=>e.target.select()} onClick={e=>e.currentTarget.select()}/>
  <div className="room-invite-controls"><button className="primary" type="button" onClick={copyInviteLink}>Copy Invite Link</button><button type="button" onClick={shareInviteLink}>Share Invite</button><button type="button" onClick={()=>{setManualInvite(true);setNotice("Use the selectable invitation text below if Samsung blocks copying.");}}>Copy Manually</button></div>
  {manualInvite&&<div className="room-invite-fallback" role="group" aria-label="Manual invitation text"><label htmlFor="room-invite-message">Ready-to-send invitation — long-press to copy</label><textarea id="room-invite-message" readOnly rows={4} value={invitationText} onFocus={e=>e.currentTarget.select()} onClick={e=>e.currentTarget.select()}/><button type="button" onClick={()=>{const el=document.getElementById('room-invite-message');el?.focus();el?.select()}}>Select Invitation Text</button></div>}
  <p className="fineprint">On Samsung, Share Invite opens Android sharing when supported. If copying is blocked, the complete invitation text appears above. The URL contains only the room code, never your private session token.</p>
 </div>}
 <p><strong>{room?.movie_title||'Loading movie…'}</strong> · {room?.status||'connecting'}</p>
 <div className="player-list" aria-label="Players in room">{room?.players?.map(p=><div key={p.id}><strong>{p.name}{p.id===session.player_id?' (you)':''}</strong><span>{p.lines} lines · {p.marked} marked</span></div>)}</div>
 {room?.status==='lobby'&&<><p>Wait until everyone has joined before starting the movie.</p><button className="primary" disabled={busy} onClick={()=>call('start')}>Start Movie (host only)</button></>}
 {card&&<><div className={"board live-board"+(celebrate?" winner":"")} role="group" aria-label="Multiplayer Bingo card" aria-busy={pending}>{'BINGO'.split('').map((l,i)=><div className="letter" key={'letter-'+i}>{l}</div>)}{card.map((t,i)=>{const marked=i===12||marks.includes(i);return <button key={i} className={'square '+(marked?'marked ':'')+(winningIndices.has(i)?'in-line':'')} aria-label={'BINGO'[i%5]+(Math.floor(i/5)+1)+': '+(i===12?'CHEESE LOUISE POD':t.label)+(i===12?' (free center square)':'')} aria-pressed={marked} aria-disabled={pending||room?.status!=='playing'||i===12} disabled={room?.status!=='playing'||i===12} onClick={()=>mark(i)} title={t.reason||t.label}><img className="square-art" src={tropeArtDataUri(t)} alt="" aria-hidden="true" decoding="async"/><span className="square-label">{i===12?'CHEESE LOUISE POD':t.label}</span>{marked&&<b aria-hidden="true">✦</b>}</button>})}</div><p className="fineprint" aria-live="polite">{myLines} completed lines. Marks are saved on the server and restored after reconnection.</p>{celebrate&&<div className="victory" role="status"><h3>{room?.mode==='blackout'?'Blackout!':'BINGO!'}</h3><p>{myLines} completed {myLines===1?'line':'lines'} on your card.</p></div>}</>}
 {room?.status==='playing'&&<button disabled={busy} onClick={()=>call('finish')}>Finish Movie (host only)</button>}
 {room?.status==='finished'&&<p>Movie night complete. Results are preserved until the room expires.</p>}
</>:<>
 {incomingRoomCode?<>{joinForm}{hostForm}</>:<>{hostForm}{joinForm}</>}
</>}
{error&&<p role="alert" className="room-error">{error}</p>}{notice&&<p role="status" className="room-notice">{notice}</p>}
<p className="fineprint">Free multiplayer early access · Up to 12 players · Room expires after 12 hours · No chat or automatic scene verification.</p></section>}
