import React,{useEffect,useMemo,useState} from 'react';
import{createRoot}from'react-dom/client';
import{score,toggle,winningLines}from './engine/bingo.mjs';
import{analyzeMovie,buildCard,replaceSquare,balance,CHEESE,SEASONAL}from './engine/intelligence.mjs';
import{refreshUntouchedCard,hasRetiredTrope}from './engine/retiredTropes.mjs';
import{tropeArtDataUri}from './engine/tropeArt.mjs';
import{approvedMoviePoster}from './engine/posters.mjs';
import{encodeInvitation,parseInvitation}from './engine/invitations.mjs';
import{parseRoomInvite}from './engine/roomInvites.mjs';
import{movies}from './data/catalog.js';
import{mergeMovieListings,movieEvidenceLabel}from './engine/movieListings.mjs';
import{loadStaticCatalog}from './services/staticCatalog.js';
import Multiplayer from './Multiplayer.jsx';
import CheeseTray from './CheeseTray.jsx';
import {validateCheesePackage,buildSharedCheeseSuggestions} from './engine/sharedCheese.mjs';
import './style.css';
import './cinematic-theme.css';
import {searchPublicMovies} from './services/movieSearch.js';
import {searchCatalog} from './services/catalog.js';
import {loadPublishedMoviePosters} from './services/publishedPosters.mjs';
const BRAND='Brought to you by the Cheese Louise Podcast';
const KEY='romantiverse-v2',HISTORY='romantiverse-history-v2',FAVORITES='romantiverse-favorites-v2';
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
const seed=()=>{if(globalThis.crypto?.getRandomValues){const value=new Uint32Array(1);globalThis.crypto.getRandomValues(value);return value[0]}return Math.floor(Math.random()*4294967295)};
const MODES=[{id:'classic',name:'Classic Bingo',description:'First complete line wins'},{id:'chase',name:'Cheese Chase',description:'Collect as many lines as you can'},{id:'blackout',name:'Blackout Challenge',description:'Mark every square before credits'},{id:'marathon',name:'Movie Marathon',description:'Build a running movie-night score'}];
const ICONS={Christmas:'✦',Fall:'❦',Horror:'☾'};
function App(){
const [sharedPackage,setSharedPackage]=useState(null);
const [shareUrl,setShareUrl]=useState('');
const [remoteMovies,setRemoteMovies]=useState([]),[remoteLoading,setRemoteLoading]=useState(false),[remoteError,setRemoteError]=useState('');
const [liveMovies,setLiveMovies]=useState([]),[catalogError,setCatalogError]=useState(''),[catalogLoading,setCatalogLoading]=useState(true);
const [publishedMovies,setPublishedMovies]=useState([]);
const [game,setGame]=useState(()=>refreshUntouchedCard(read(KEY,null))),[history,setHistory]=useState(()=>read(HISTORY,[])),[favorites,setFavorites]=useState(()=>read(FAVORITES,[]));
const [tab,setTab]=useState(()=>{if(parseRoomInvite(window.location.search))return 'together';try{if(sessionStorage.getItem('romantiverse-last-tab')==='play'&&read(KEY,null))return 'play'}catch{}return 'discover'}),[query,setQuery]=useState(''),[season,setSeason]=useState('Christmas'),[custom,setCustom]=useState(''),[free,setFree]=useState(true),[mode,setMode]=useState('classic'),[difficulty,setDifficulty]=useState('balanced'),[ratio,setRatio]=useState(50),[notice,setNotice]=useState(''),[editIndex,setEditIndex]=useState(null),[filter,setFilter]=useState('All'),[showClues,setShowClues]=useState(false);
useEffect(()=>{const ctrl=new AbortController();Promise.allSettled([loadStaticCatalog({signal:ctrl.signal}),searchCatalog('',{limit:100,signal:ctrl.signal})]).then(results=>{if(ctrl.signal.aborted)return;const items=mergeMovieListings(results.map(r=>r.status==='fulfilled'?r.value.items:[]));setLiveMovies(items.map(m=>({...m,story_facts:m.story_facts||{setting:[],relationship:[],conflict:[],event:[]},kind:'CATALOG MOVIE · SCENES UNVERIFIED'})));setCatalogError(items.length?'':'Movie catalog temporarily unavailable. You can still play any title.')}).finally(()=>{if(!ctrl.signal.aborted)setCatalogLoading(false)});return()=>ctrl.abort()},[]);
useEffect(()=>{
 // HQ changes propagate automatically on page load, when returning to the tab,
 // and every five minutes without a public connection to private HQ tables.
 let controller=null;
 const refresh=async()=>{
  controller?.abort();const next=new AbortController();controller=next;
  try{const items=await loadPublishedMoviePosters({signal:next.signal});if(!next.signal.aborted)setPublishedMovies(items)}
  catch(error){if(!next.signal.aborted)console.warn('Public HQ artwork refresh unavailable',error)}
 };
 const onVisible=()=>{if(document.visibilityState==='visible')refresh()};
 refresh();
 const timer=window.setInterval(refresh,300000);
 document.addEventListener('visibilitychange',onVisible);
 return()=>{controller?.abort();window.clearInterval(timer);document.removeEventListener('visibilitychange',onVisible)};
},[]);
useEffect(()=>{
 const term=query.trim();
 if(term.length<3){setRemoteMovies([]);setRemoteLoading(false);setRemoteError('');return;}
 const ctrl=new AbortController();setRemoteLoading(true);setRemoteError('');
 const timeout=setTimeout(()=>Promise.allSettled([searchCatalog(term,{limit:50,signal:ctrl.signal}),searchPublicMovies(term,{signal:ctrl.signal})]).then(results=>{if(ctrl.signal.aborted)return;const db=results[0].status==='fulfilled'?results[0].value.items:[];const publicResults=results[1].status==='fulfilled'?results[1].value:[];setRemoteMovies([...db.map(m=>({...m,story_facts:m.story_facts||{setting:[],relationship:[],conflict:[],event:[]},kind:'CATALOG MOVIE · SCENES UNVERIFIED'})),...publicResults]);setRemoteError(results.every(r=>r.status==='rejected')?'Live search unavailable. You can still play any title.':'')}).finally(()=>{if(!ctrl.signal.aborted)setRemoteLoading(false)}),350);
 return()=>{clearTimeout(timeout);ctrl.abort()};
},[query]);
useEffect(()=>{
 const openInvite=()=>{
  const hash=window.location.hash;
  if(!hash.startsWith('#invite=')&&!hash.startsWith('#card='))return;
  const invite=parseInvitation(hash);
  if(!invite){setNotice('This game invitation could not be opened.');return}
  try{
   const movie={id:'invite-'+invite.movie.title,title:invite.movie.title,season:invite.movie.season,story_facts:{setting:[],relationship:[],conflict:[],event:[]}};
   const cardTheme=invite.cardTheme||invite.movie.season;
   const card=buildCard({...movie,season:cardTheme},{seed:seed(),free:invite.free,difficulty:invite.difficulty,cheeseRatio:invite.ratio/100});
   setShareUrl('');
    setGame({movie,cardTheme,card,marked:invite.free?[12]:[],free:invite.free,mode:invite.mode,difficulty:invite.difficulty,ratio:invite.ratio,startedAt:new Date().toISOString(),completed:false});
   setTab('play');setNotice('Your own randomized Bingo card is ready.');
   window.history.replaceState(null,'',window.location.pathname+window.location.search);
  }catch{setNotice('This game invitation could not be opened.')}
 };
 openInvite();
 window.addEventListener('hashchange',openInvite);
 return()=>window.removeEventListener('hashchange',openInvite);
},[]);
useEffect(()=>write(KEY,game),[game]);useEffect(()=>{try{sessionStorage.setItem('romantiverse-last-tab',tab)}catch{}},[tab]);useEffect(()=>write(HISTORY,history),[history]);useEffect(()=>write(FAVORITES,favorites),[favorites]);
const active=game?.movie||null;const analysis=useMemo(()=>active?analyzeMovie({...active,season:game?.cardTheme||active.season}):null,[active?.title,active?.synopsis,active?.season,game?.cardTheme]);
const status=game?score(game.marked,game.free):null;
const won=game&&(game.mode==='blackout'?game.marked.length===25:status.bingo);
const lines=game?winningLines(game.marked,game.free):[];
const available=mergeMovieListings([
 (sharedPackage?.movies||[]).map(m=>({...m,kind:'CHEESE LOUISE CURATED'})),
 liveMovies.map(m=>({...m,kind:'REAL MOVIE · SCENES UNVERIFIED'})),
 movies,
 remoteMovies,
 publishedMovies
]).filter(m=>(filter==='All'||m.season===filter)&&(m.title+' '+(m.synopsis||'')+' '+Object.values(m.story_facts||{}).flat().join(' ')).toLowerCase().includes(query.toLowerCase()));
function create(movie,selectedTheme=season){try{const unclassified=movie.season==='Unspecified';const cardTheme=unclassified?selectedTheme:movie.season;const playable={...movie,season:cardTheme};let card=buildCard(playable,{seed:seed(),free,difficulty,cheeseRatio:ratio/100});
 const editorial=buildSharedCheeseSuggestions(playable,sharedPackage?.traits);
 if(editorial.length){const seen=new Set(card.map(t=>t.id));let j=0;card=card.map(t=>{if(t.category!=='cheese')return t;while(j<editorial.length&&seen.has(editorial[j].id))j++;if(j>=editorial.length)return t;const next=editorial[j++];seen.add(next.id);return next})}
setShareUrl('');setGame({movie,cardTheme,card,marked:free?[12]:[],free,mode,difficulty,ratio,startedAt:new Date().toISOString(),completed:false});setTab('play');setEditIndex(null);setNotice(unclassified?'The movie season is unverified. Using your selected '+cardTheme+' card theme.':'Your movie night starts here. Card saved on this device.')}catch(e){setNotice(e.message)}}
function mark(i){if(!game||game.completed)return;setGame(g=>({...g,marked:toggle(g.marked,i,g.free)}))}
function edit(i,item){try{setGame(g=>({...g,card:replaceSquare(g.card,i,item)}));setEditIndex(null);setNotice('Square updated.')}catch(e){setNotice(e.message)}}
function finish(){if(!game)return;const entry={id:Date.now(),title:game.movie.title,season:game.movie.season,mode:game.mode,lines:lines.length,marked:game.marked.length-(game.free?1:0),won:Boolean(won),date:new Date().toISOString(),card:game.card.map(t=>t.label)};setHistory(h=>[entry,...h].slice(0,250));setGame(g=>({...g,completed:true}));setTab('results')}
function restart(){if(!game)return;if(window.confirm('Start a new card for this movie? Your current marks will be replaced.'))create(game.movie,game.cardTheme||season)}
async function share(){
 if(!game)return;
 let url;
 try{
  // Keep a selectable link visible even if the native share sheet or clipboard is unavailable.
  url=location.origin+location.pathname+'#invite='+encodeInvitation(game);
  setShareUrl(url);
 }catch{setNotice('Could not create a secure invitation link.');return}
 const text='Play Romantiverse Bingo with me for '+game.movie.title+'! You get a fresh randomized card.';
 try{
  if(navigator.share){await navigator.share({title:'Romantiverse Bingo — '+game.movie.title,text,url});return}
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);setNotice('Game invitation link copied!');return}
 }catch{}
 setNotice('Select and copy your invitation link below.');
}
async function copyShareLink(){
 if(!shareUrl)return;
 try{
  if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
  await navigator.clipboard.writeText(shareUrl);
  setNotice('Game invitation link copied!');
 }catch{setNotice('Select and copy your invitation link below.')}
}
async function importCheesePackage(file){if(!file)return;try{if(file.size>3000000)throw Error('File too large');const parsed=validateCheesePackage(JSON.parse(await file.text()));setSharedPackage(parsed);setNotice('Imported '+parsed.movies.length+' Cheese Louise movies and '+parsed.traits.length+' original tropes for this session.');}catch(e){setNotice('Import failed: '+e.message)}}
function toggleFav(id){setFavorites(f=>f.includes(id)?f.filter(x=>x!==id):[...f,id])}
return <div className="app">
<header className="masthead"><div className="ornament">✧ ✦ ✧</div><div className="eyebrow">A MOVIE NIGHT EVENT</div><h1>Romantiverse <em>Bingo</em></h1><p className="brand">{BRAND}</p></header>
<nav className="nav" aria-label="Main navigation">{[['discover','Discover'],['play','My Card'],['workshop','Workshop'],['together','Play Together'],['history','Cheese Tray'],['rules','How to Play']].map(([id,label])=><button key={id} className={tab===id?'active':''} aria-pressed={tab===id} disabled={['play','workshop'].includes(id)&&!game} onClick={()=>setTab(id)}>{label}</button>)}</nav>
<main>
{tab==='discover'&&<><section className="hero"><div className="hero-kicker">WELCOME TO YOUR HAPPILY EVER AFTER</div><h2>Every love story has its clichés.<br/><em>Make a game of them.</em></h2><p>Grab a drink. Pick a movie. Prepare for an unreasonable number of misunderstandings.</p><button className="primary" onClick={()=>document.getElementById('movie-search')?.focus()}>Find tonight's movie ↓</button></section>
<section className="panel"><div className="section-heading"><div><div className="eyebrow">THE FEATURE PRESENTATION</div><h2>Choose Your Movie</h2></div><span className="fineprint">{catalogLoading?'Loading bundled catalog…':liveMovies.length+' catalog movies · '+movies.length+' demos'}</span></div><input id="movie-search" aria-label="Search movies by title" placeholder="Search any movie title (including beyond our catalog)…" value={query} onChange={e=>setQuery(e.target.value)}/><p className="fineprint">Movie listings and trope suggestions are updated automatically when scheduled catalog checks succeed. No account or manual import is required to play.</p><label className="fineprint" htmlFor="unclassified-theme">Card theme for movies with no verified season: </label><select id="unclassified-theme" aria-label="Card theme for movies with no verified season" value={season} onChange={e=>setSeason(e.target.value)}>{Object.keys(SEASONAL).map(s=><option key={s}>{s}</option>)}</select><p className="fineprint">This theme only controls the Bingo squares. It does not describe verified movie scenes or season.</p>{query.trim().length>=3&&<p className="fineprint" role="status">{remoteLoading?'Searching public movie titles…':remoteError||('Found '+available.length+' matching titles.')}</p>}<div className="filters">{['All','Christmas','Fall'].map(f=><button key={f} className={filter===f?'selected':''} aria-pressed={filter===f} onClick={()=>setFilter(f)}>{f==='All'?'✧ ':ICONS[f]+' '}{f}</button>)}</div>{catalogError&&<p role="status" className="fineprint">{catalogError}</p>}<div className="movie-grid">{available.map(m=>{const poster=approvedMoviePoster(m);return <article className={'movie-card '+m.season.toLowerCase()} key={m.id}><div className={'movie-art '+(poster?'has-poster':'')}><span aria-hidden="true">{ICONS[m.season]||'✧'}</span><small aria-hidden="true">{m.season==='Unspecified'?'SEASON UNVERIFIED':m.season+' FEATURE'}</small>{poster&&<><img className="movie-poster" src={poster.url} alt={m.title+' movie poster'} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={e=>{e.currentTarget.hidden=true}}/><small className="poster-credit">{poster.credit}</small></>}</div><div className="movie-info"><div className="movie-tags"><span>{m.season}</span>{Number.isInteger(m.release_year)&&<span>{m.release_year}</span>}<span>{movieEvidenceLabel(m)}</span></div><h3>{m.title}</h3><p>{m.synopsis||'Movie-specific Bingo suggestions are generated from story facts and original tropes. Scene details are unverified.'}</p><div className="movie-actions"><button className="primary" onClick={()=>create(m)}>Play This Movie</button><button className="heart" aria-label={(favorites.includes(m.id)?'Remove ':'Add ')+m.title+(favorites.includes(m.id)?' from favorites':' to favorites')} aria-pressed={favorites.includes(m.id)} onClick={()=>toggleFav(m.id)}>{favorites.includes(m.id)?'♥':'♡'}</button></div></div></article>})}</div>{query.trim().length>=3&&!remoteLoading&&!available.length&&<div className="panel" role="status"><h3>Can't find “{query.trim()}”?</h3><p>Public movie databases don't list every Hallmark or Lifetime title. You can still create a Bingo card for this exact movie right now.</p><button className="primary" onClick={()=>create({id:'custom-'+query.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-'),title:query.trim(),season:'Unspecified',synopsis:'',kind:'CUSTOM · TITLE UNVERIFIED'})}>Play “{query.trim()}”</button></div>}</section>
<section className="panel"><div className="eyebrow">NOT IN THE CATALOG?</div><h2>Play Any Movie</h2><p>Use any movie title with a card theme you choose. Its actual season and scenes remain unverified.</p><div className="custom-row"><input aria-label="Custom movie title" value={custom} onChange={e=>setCustom(e.target.value)} placeholder="Enter a movie title"/><select aria-label="Card theme for custom movie" value={season} onChange={e=>setSeason(e.target.value)}>{Object.keys(SEASONAL).map(s=><option key={s}>{s}</option>)}</select><button className="primary" disabled={!custom.trim()} onClick={()=>create({id:'custom',title:custom.trim(),season:'Unspecified',synopsis:'',kind:'CUSTOM · TITLE UNVERIFIED'})}>Create Card</button></div></section>
<section className="panel"><div className="eyebrow">YOUR MOVIE NIGHT, YOUR TROPES</div><h2>Game Setup</h2><div className="mode-grid">{MODES.map(m=><button key={m.id} className={'mode '+(mode===m.id?'chosen':'')} aria-pressed={mode===m.id} onClick={()=>setMode(m.id)}><strong>{m.name}</strong><span>{m.description}</span></button>)}</div><div className="settings"><label>Difficulty <select value={difficulty} onChange={e=>setDifficulty(e.target.value)}><option value="easy">Easy — familiar clichés</option><option value="balanced">Balanced — best for movie night</option><option value="hard">Hard — rarer moments</option></select></label><label className="check"><input type="checkbox" checked={free} onChange={e=>setFree(e.target.checked)}/> Free center square</label></div><p className="fineprint">Cards automatically mix familiar story and seasonal tropes. Difficulty changes the predicted likelihood of squares; movie scenes are never guaranteed.</p></section></>}
{tab==='play'&&game&&<><section className="play-heading"><div className="eyebrow">NOW SHOWING · {(game.cardTheme||game.movie.season).toUpperCase()} CARD{game.movie.season==='Unspecified'?' · MOVIE SEASON UNVERIFIED':''}</div><h2>{game.movie.title}</h2><p>{game.mode==='blackout'?'Every square counts.':game.mode==='chase'?'How many lines can you collect?':'Spot the moments. Complete a line. Call BINGO!'}</p></section>{hasRetiredTrope(game)&&<p className="panel fineprint" role="status">This saved card contains a retired trope. Choose New Card to replace it; your existing marks will not be changed automatically.</p>}<div className="score-strip"><span>{Math.max(0,status.marked-(game.free?1:0))} MARKED</span><strong aria-live="polite">{won?'✦ BINGO! ✦':lines.length?lines.length+' LINES':'THE PLOT THICKENS…'}</strong><span>{lines.length} LINES</span></div><div className={'board '+(won?'winner':'')} role="group" aria-label="Your Bingo card">{'BINGO'.split('').map((l,i)=><div className="letter" key={'l'+i}>{l}</div>)}{game.card.map((t,i)=><button key={i} aria-label={'BINGO'[i%5]+(Math.floor(i/5)+1)+': '+t.label+(t.category==='free'?' (free center square)':'')} aria-pressed={game.marked.includes(i)} disabled={game.completed||t.category==='free'} title={t.reason||t.label} className={'square '+(game.marked.includes(i)?'marked ':'')+(lines.some(line=>line.includes(i))?'in-line':'')} onClick={()=>mark(i)}><img className="square-art" src={tropeArtDataUri(t)} alt="" aria-hidden="true" decoding="async"/><span className="square-label">{t.label}</span>{game.marked.includes(i)&&<b aria-hidden="true">✦</b>}</button>)}</div><div className="panel intelligence-panel"><button className="explain-toggle" aria-expanded={showClues} onClick={()=>setShowClues(x=>!x)}>{showClues?'▾ Hide':'▸ Show'} why these tropes were selected</button>{showClues&&<><p>Your card contains {game.card.filter(t=>t.category!=='free').length} tropes. Predictions describe plausible movie moments—not confirmed scenes.</p><p className="fineprint">Offline Cheese Intelligence · no AI subscription, account, or paid service. Predictions are based on movie metadata and curated tropes.</p><div className="explain-list">{game.card.filter(t=>t.category!=='free').map(t=><div key={t.id}><strong>{t.label}</strong><span>Trope · {t.evidence==='synopsis'?'Story fact or title clue':'Genre prediction'} · {t.reason}</span></div>)}</div></>}</div><div className="play-actions"><button onClick={()=>setTab('workshop')}>✎ Edit Card</button><button onClick={share}>↗ Share Card</button><button onClick={restart}>↻ New Card</button></div>{shareUrl&&<div className="room-invite" role="group" aria-label="Direct game invitation"><label htmlFor="game-invite-url">Your direct invitation link</label><div className="room-invite-controls"><input id="game-invite-url" aria-label="Direct game invitation link" readOnly value={shareUrl} onFocus={e=>e.target.select()} onClick={e=>e.target.select()}/><button type="button" onClick={copyShareLink}>Copy Link</button></div><p className="fineprint">Select and copy this link if sharing is blocked. Every guest gets a fresh randomized card; your marks and private session stay on this device.</p></div>}{won&&<div className="victory"><div className="ornament">✦ ✧ ✦</div><h2>{game.mode==='blackout'?'A Perfectly Cheesy Blackout!':'Happily Ever After!'}</h2><p>You earned {lines.length} completed {lines.length===1?'line':'lines'}. Your movie night deserves a little celebration.</p></div>}<div className="panel"><h3>Movie-night results</h3><p>Finish the game at the credits to save the outcome to your Cheese Tray.</p><button className="primary" disabled={game.completed} onClick={finish}>Finish & Save Results</button></div><p className="fineprint">Tap marked squares to undo. Marks are based on what you observe—not automatically verified by AI. Your card autosaves locally.</p></>}
{tab==='workshop'&&game&&<><section className="section-heading"><div><div className="eyebrow">MAKE IT YOURS</div><h2>The Card Workshop</h2></div><button onClick={()=>setTab('play')}>← Back to Card</button></section><div className="panel"><p>Choose any square to swap its trope. The engine blocks duplicate squares and protects the free center.</p><div className="balance"><span>{game.card.filter(t=>t.category!=='free').length} tropes on your card</span></div><div className="workshop-grid">{game.card.map((t,i)=><button key={i} disabled={t.category==='free'||game.completed} className={'workshop-tile '+(editIndex===i?'selected':'')} onClick={()=>setEditIndex(i)}><small>{i+1} · {t.category==='free'?'Free center':'Trope'}</small><strong>{t.label}</strong></button>)}</div></div>{editIndex!==null&&<div className="panel"><h3>Replace square {editIndex+1}</h3><p>Suggested choices are predictions, not guaranteed movie events.</p><div className="suggestions">{[...analysis.cheese,...analysis.seasonal].filter(t=>!game.card.some((c,i)=>i!==editIndex&&c.id===t.id)).slice(0,50).map(t=><button key={t.id} onClick={()=>edit(editIndex,t)}><strong>{t.label}</strong><small>Trope · {Math.round(t.confidence*100)}% relative prediction · {t.reason}</small></button>)}</div><button onClick={()=>setEditIndex(null)}>Cancel</button></div>}<div className="panel"><button className="primary" onClick={()=>setTab('play')}>Done Editing →</button></div></>}
{tab==='together'&&<Multiplayer movie={game?{...game.movie,season:game.cardTheme||game.movie.season}:{title:custom.trim()||'A Very Cheesy Christmas',season}} mode={game?.mode||mode}/>}
{tab==='history'&&<><CheeseTray/><section className="section-heading"><div><div className="eyebrow">EVERY MOVIE HAS A STORY</div><h2>The Cheese Tray</h2></div></section><div className="stats-grid"><div><strong>{history.length}</strong><span>Movie Nights</span></div><div><strong>{history.filter(x=>x.won).length}</strong><span>Bingo Wins</span></div><div><strong>{history.reduce((n,x)=>n+x.lines,0)}</strong><span>Completed Lines</span></div></div>{history.length?history.map(h=><article className="history-entry" key={h.id}><div><strong>{h.title}</strong><small>{new Date(h.date).toLocaleDateString()} · {h.mode}</small></div><span>{h.won?'✦ WIN':'NO BINGO'} · {h.lines} lines</span></article>):<div className="panel"><h3>Your Cheese Tray is empty</h3><p>Finish a game to start collecting movie-night memories.</p><button className="primary" onClick={()=>setTab('discover')}>Pick a Movie</button></div>}<p className="fineprint">Results are stored only in this browser for now. Cloud sync is not connected.</p></>}
{tab==='results'&&game&&<section className="results-card"><div className="ornament">✧ ✦ ✧</div><div className="eyebrow">YOUR MOVIE NIGHT RECAP</div><h2>{won?'Certified Cheese!':'The Credits Rolled'}</h2><h3>{game.movie.title}</h3><div className="stats-grid"><div><strong>{lines.length}</strong><span>Bingo Lines</span></div><div><strong>{Math.max(0,status.marked-(game.free?1:0))}</strong><span>Marked Tropes</span></div></div><p>{BRAND}</p><CheeseTray game={game} submit={true}/><button className="primary" onClick={()=>setTab('history')}>See the Cheese Tray</button><button onClick={()=>setTab('discover')}>Play Another</button></section>}
{tab==='rules'&&<><section className="hero"><div className="eyebrow">HOW TO PLAY ROMANTIVERSE BINGO</div><h2>Predictable romance.<br/><em>Unpredictable Bingo.</em></h2><p>Choose a movie, get a balanced card, and mark a square whenever you genuinely observe that moment on screen. Five in a row—across, down, or diagonal—is Bingo.</p></section><div className="panel"><h3>What is a trope?</h3><p>A trope is a recurring story moment: an impossible coincidence, an avoidable misunderstanding, an almost-kiss, a grand gesture, or a holiday tradition. Every Bingo square is simply a trope to watch for.</p><h3>Can we play with friends?</h3><p>Share a game invitation link. It opens directly to that movie with a fresh randomized Bingo card for each player.</p><h3>Can I change a square?</h3><p>Yes. Open the Card Workshop and replace any non-free square. Your changes are saved with your card.</p></div></>}
</main><footer><div className="ornament">✧ ✦ ✧</div><strong>{BRAND}</strong><small>Romantiverse Bingo · Independent movie-night game · Early access</small></footer>{notice&&<div className="toast" role="status"><span>{notice}</span><button aria-label="Dismiss notice" onClick={()=>setNotice('')}>×</button></div>}</div>}
createRoot(document.getElementById('root')).render(<App/>);

if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/Romantiverse-Bingo-App/sw.js',{updateViaCache:'none'}).catch(()=>{}));}
