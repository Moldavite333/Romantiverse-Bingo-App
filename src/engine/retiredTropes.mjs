import {analyzeMovie} from './intelligence.mjs';

// Retired labels must not reappear when a player reloads an untouched saved card.
// Preserve any game with actual marks: silently rewriting an observed square would
// corrupt the player's movie-night record.
const RETIRED_IDS=new Set(['cozy-drink','cl-cozy-drink']);
const RETIRED_LABELS=new Set(['an emotionally significant hot beverage']);
export function isRetiredTrope(t){
 return Boolean(t&&(RETIRED_IDS.has(t.id)||RETIRED_LABELS.has(String(t.label||'').trim().toLowerCase().replace(/\s+/g,' '))));
}
export function hasRetiredTrope(game){
 return Array.isArray(game?.card)&&game.card.some(isRetiredTrope);
}
export function refreshUntouchedCard(game){
 if(!hasRetiredTrope(game)||game?.completed||!game?.movie||!Array.isArray(game.marked)||
    (game.free?game.marked.some(i=>i!==12):game.marked.length>0)||game.card.length!==25)return game;
 try{
  const theme=game.cardTheme||game.movie.season;
  const {cheese}=analyzeMovie({...game.movie,season:theme});
  const used=new Set(game.card.map(t=>t?.id));
  const next=[...game.card];
  for(let i=0;i<next.length;i++){
   if(!isRetiredTrope(next[i]))continue;
   const replacement=cheese.find(t=>!used.has(t.id)&&!isRetiredTrope(t));
   if(!replacement)return game;
   next[i]=replacement;
   used.add(replacement.id);
  }
  return {...game,card:next};
 }catch{return game}
}
