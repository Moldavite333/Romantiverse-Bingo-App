import React,{useEffect,useId,useRef} from 'react';
import './win-celebration.css';

export default function WinCelebration({won,blackout,lines,onDismiss}){
 const dialog=useRef(null),title=useId();
 useEffect(()=>{
  const node=dialog.current;
  if(won&&!node.open)node.showModal();
  if(!won&&node.open)node.close();
 },[won]);
 return <dialog ref={dialog} className="win-celebration" aria-labelledby={title} onCancel={onDismiss} onKeyDown={e=>e.stopPropagation()}>
  <div className="win-celebration-ornament" aria-hidden="true">✦ ✧ ✦</div>
  <p className="win-celebration-kicker">{blackout?'EVERY SQUARE. A PERFECT ENDING.':'BINGO! YOUR HAPPY ENDING.'}</p>
  <h2 id={title}>{blackout?'A Perfectly Cheesy Blackout!':'Happily Ever After!'}</h2>
  <p>You earned {lines} completed {lines===1?'line':'lines'}. Your movie night deserves a little celebration.</p>
  <form method="dialog" onSubmit={onDismiss}><button autoFocus>Keep Playing</button></form>
 </dialog>;
}
