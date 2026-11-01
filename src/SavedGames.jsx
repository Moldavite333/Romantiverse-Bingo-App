import React from 'react';
import {rememberedRooms} from './engine/roomMemory.mjs';
export default function SavedGames({game,onSolo,onRoom}){
 const rooms=rememberedRooms();if(!game&&!rooms.length)return null;
 return <section className="panel" aria-label="Saved games"><h2>Your saved games</h2><p>Your current cards and confirmed marks are saved before the movie ends.</p>
 {game&&<article className="history-entry"><div><strong>{game.movie.title}</strong><small>Your individual card · {game.marked.length-(game.free?1:0)} marked</small></div><button onClick={onSolo}>{game.completed?'Review card':'Resume card'}</button></article>}
 {rooms.map(row=><article className="history-entry" key={row.code+row.player_id}><div><strong>{row.room.movie_title}</strong><small>Shared game {row.code} · {row.marked.filter(i=>i!==12).length} marked</small></div><button onClick={()=>onRoom(row)}>{row.room.status==='finished'?'Review shared game':'Resume shared game'}</button></article>)}
 </section>;
}
