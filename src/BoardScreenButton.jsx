import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import './board-screen.css';
export default function BoardScreenButton({openOnStart=false}){
 const button=useRef(null),[active,setActive]=useState(openOnStart),scroll=useRef(0);
 useEffect(()=>{if(openOnStart)setActive(true)},[openOnStart]);
 useLayoutEffect(()=>{
  const table=button.current?.closest('.game-table,.live-game-table');
  if(!active||!table)return;
  scroll.current=window.scrollY;
  table.classList.add('board-screen');
  const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  const close=()=>{setActive(false);if(document.fullscreenElement===table)document.exitFullscreen().catch(()=>{});};
  let enteredNative=document.fullscreenElement===table;
  const change=()=>{
   if(document.fullscreenElement===table)enteredNative=true;
   else if(enteredNative)setActive(false);
  };
  const key=e=>{
   if(e.key==='Escape'){e.preventDefault();close()}
   if(e.key==='Tab'){
    const items=[...table.querySelectorAll('button:not(:disabled)')].filter(x=>x.getClientRects().length),first=items[0],last=items.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
   }
  };
  document.addEventListener('keydown',key);document.addEventListener('fullscreenchange',change);
  button.current?.focus({preventScroll:true});
  return()=>{table.classList.remove('board-screen');document.body.style.overflow=oldOverflow;document.removeEventListener('keydown',key);document.removeEventListener('fullscreenchange',change);if(document.fullscreenElement===table)document.exitFullscreen().catch(()=>{});window.scrollTo({top:scroll.current,behavior:'instant'});button.current?.focus()};
 },[active]);
 function toggle(){
  const table=button.current.closest('.game-table,.live-game-table');
  if(active){setActive(false);return}
  setActive(true);
  // Mobile browser fullscreen adds system overlays over the last row.
  // Use the same edge-to-edge in-page view on phones without those overlays.
  if(window.matchMedia('(min-width:900px)').matches)table.requestFullscreen?.().catch(()=>{});
 }
 return <button ref={button} type="button" className="board-screen-toggle" aria-pressed={active} onClick={toggle}>{active?'Exit Full Screen':'Full Screen Board'}</button>;
}
