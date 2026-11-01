import React from 'react';
import TropeIllustration from './TropeIllustration.jsx';
import './card-art-guide.css';

// An optional, readable alternative to the compact five-column Bingo board.
// Both views mark the same card; no extra game state or account is introduced.
export default function CardArtGuide({card,marked=[],free=true,onMark,disabled=false}){
 if(!Array.isArray(card)||card.length!==25)return null;
 return <details className="card-art-guide">
  <summary>View larger artwork and full square names</summary>
  <p className="card-art-guide-help">Tap a larger illustration to mark or unmark its trope. Your regular Bingo card updates too.</p>
  <div className="card-art-guide-grid" role="group" aria-label="Larger Bingo squares">
   {card.map((trope,index)=>{
    const isFree=free&&index===12;
    const isMarked=isFree||marked.includes(index);
    const label=isFree?'CHEESE LOUISE POD':trope.label;
    const coordinate='BINGO'[index%5]+(Math.floor(index/5)+1);
    return <button key={index} type="button"
     className="card-art-guide-square"
     aria-label={coordinate+': '+label+(isFree?' (free center square)':'')}
     aria-pressed={isMarked}
     disabled={disabled||isFree||!onMark}
     onClick={()=>onMark?.(index)}>
      <span className="card-art-guide-coordinate">{coordinate}{isMarked?' · Marked':''}</span>
      <TropeIllustration trope={trope}/>
      <span className="card-art-guide-label">{label}</span>
     </button>;
   })}
  </div>
 </details>;
}
