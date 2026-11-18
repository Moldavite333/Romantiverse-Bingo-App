import React,{useReducer} from 'react';
import {forgetRoom,rememberedRooms} from './engine/roomMemory.mjs';
export default function SavedGames({game,onSolo,onRoom,onDeleteSolo}){
 const [,refresh]=useReducer(count=>count+1,0);
 const rooms=rememberedRooms();
 // A truncated or stale browser save must not crash Discover or prevent a new invitation.
 const saved=game&&game.movie&&typeof game.movie.title==='string'&&Array.isArray(game.card)&&game.card.length===25&&Array.isArray(game.marked)?game:null;
 function deleteShared(row){
  if(row.room.status==='finished'||!window.confirm('Remove this shared card from your device? Other players can keep playing.'))return;
  forgetRoom(row);
  refresh();
 }
 if(!saved&&!rooms.length)return null;
 return <section className="panel" aria-label="Saved games"><h2>Your saved games</h2><p>Your current cards and confirmed marks are saved before the movie ends.</p>
 {saved&&<article className="history-entry"><div><strong>{saved.movie.title}</strong><small>Your individual card · {saved.marked.length-(saved.free?1:0)} marked</small></div><button onClick={onSolo}>{saved.completed?'Review card':'Resume card'}</button>{!saved.completed&&onDeleteSolo&&<button onClick={onDeleteSolo} aria-label={'Delete card for '+saved.movie.title}>Delete</button>}</article>}
 {rooms.map(row=><article className="history-entry" key={row.code+row.player_id}><div><strong>{row.room.movie_title}</strong><small>Shared game {row.code} · {row.marked.filter(i=>i!==12).length} marked</small></div><button onClick={()=>onRoom(row)}>{row.room.status==='finished'?'Review shared game':'Resume shared game'}</button>{row.room.status!=='finished'&&<button onClick={()=>deleteShared(row)} aria-label={'Delete shared card for '+row.room.movie_title}>Delete</button>}</article>)}
 </section>;
}
