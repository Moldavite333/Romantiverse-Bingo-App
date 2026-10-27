import React,{useEffect,useState} from 'react';
import {loadCheeseTray,submitCheeseTray} from './services/cheeseTray.js';
const NICK='cheese-tray-nickname-v1',DEVICE='cheese-tray-device-v1';
function device(){let id=localStorage.getItem(DEVICE);if(!id){id=crypto.randomUUID();localStorage.setItem(DEVICE,id)}return id}
export default function CheeseTray({game,submit=false}){
 const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [nickname,setNickname]=useState(()=>localStorage.getItem(NICK)||'');
 const [busy,setBusy]=useState(false),[sent,setSent]=useState(false);
 const refresh=()=>{setLoading(true);loadCheeseTray('all').then(data=>{setRows(data);setError('')}).catch(e=>setError(e.message)).finally(()=>setLoading(false))};
 useEffect(refresh,[]);
 async function enter(e){e.preventDefault();if(!game||busy)return;setBusy(true);setError('');try{
  const result=await submitCheeseTray({playerId:device(),nickname:nickname.trim(),movie:game.movie,marked:game.marked,free:game.free});
  localStorage.setItem(NICK,nickname.trim());setSent(true);refresh();
 }catch(e){setError(e.message)}finally{setBusy(false)}}
 const lineCount=game?.marked?(()=>{const m=new Set(game.marked);if(game.free)m.add(12);let n=0;for(let r=0;r<5;r++)if(Array.from({length:5},(_,c)=>r*5+c).every(i=>m.has(i)))n++;for(let c=0;c<5;c++)if(Array.from({length:5},(_,r)=>r*5+c).every(i=>m.has(i)))n++;if([0,6,12,18,24].every(i=>m.has(i)))n++;if([4,8,12,16,20].every(i=>m.has(i)))n++;return n})():0;
 return <section className="panel cheese-tray" aria-label="Community leaderboard">
  <div className="eyebrow">CHEESE LOUISE COMMUNITY</div><h2>🏆 The Cheese Tray</h2>
  <p>Only completed Bingo lines score: 100 points per line, up to 1,200 for a blackout. One best result per player per movie, with no weekly reset. Replay to improve your score. No account needed.</p>
  {submit&&game?.completed&&lineCount>0&&<div className="tray-submit"><h3>Join the fan leaderboard</h3><p>Choose a public nickname. By submitting, you agree that we may display your nickname and mention it on the Cheese Louise podcast.</p><form onSubmit={enter}><input aria-label="Public player nickname" placeholder="Your public nickname" value={nickname} maxLength={24} onChange={e=>setNickname(e.target.value)} required pattern="[A-Za-z0-9][A-Za-z0-9 _.-]{1,23}"/><button className="primary" disabled={busy||sent}>{sent?'Score submitted':busy?'Submitting…':`Submit ${lineCount*100} points`}</button></form></div>}
  <p className="fineprint">All-time standings · one best score per movie</p>
  {loading?<p role="status">Loading leaderboard…</p>:rows.length?<ol className="tray-ranks">{rows.map(p=><li key={p.rank}><span className="tray-rank">#{p.rank}</span><strong>{p.nickname}</strong><span>{p.points.toLocaleString()} pts · {p.lines} lines · {p.movies} movies</span></li>)}</ol>:<p>No qualifying scores yet. Be the first to fill the Cheese Tray!</p>}
  {error&&<p role="alert" className="room-error">{error}</p>}
  <p className="fineprint">Rankings use server-calculated lines from submitted marks. Observed movie moments are reported by players, not independently verified.</p>
 </section>
}
