import React,{useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {gameAudio} from './engine/gameAudio.mjs';
import {feedbackCue,gameProgress} from './engine/gameFeel.mjs';
import './game-feel.css';

export default function GameFeel({cardKey,marked,free=true,mode='classic',active=true}){
 const anchor=useRef(null),previous=useRef(null),timer=useRef(null);
 const enabled=useSyncExternalStore(gameAudio.subscribe,()=>gameAudio.enabled,()=>false);
 const [audioNotice,setAudioNotice]=useState('');
 const progress=gameProgress(marked,free);
 function reveal(audible=false){
  const table=anchor.current?.closest('.game-table,.live-game-table'),board=table?.querySelector('.board');if(!board)return;
  clearTimeout(timer.current);board.classList.remove('reel-reveal');void board.offsetWidth;board.classList.add('reel-reveal');
  timer.current=setTimeout(()=>board.classList.remove('reel-reveal'),1100);
  if(audible)gameAudio.unlock().then(ok=>{if(ok)gameAudio.play('deal')});
 }
 useEffect(()=>{
  const table=anchor.current?.closest('.game-table,.live-game-table'),board=table?.querySelector('.board');
  const gesture=e=>{if(e.target.closest('.square,.card-art-guide-square'))gameAudio.unlock()};
  const hidden=()=>{if(document.hidden)gameAudio.hush()};
  table?.addEventListener('click',gesture,true);document.addEventListener('visibilitychange',hidden);
  return()=>{clearTimeout(timer.current);board?.classList.remove('reel-reveal');table?.removeEventListener('click',gesture,true);document.removeEventListener('visibilitychange',hidden);gameAudio.hush()};
 },[]);
 useEffect(()=>{
  const old=previous.current;previous.current={key:cardKey,marked:[...marked]};
  if(!old||old.key!==cardKey){reveal();return;}
  if(active){const cue=feedbackCue(old.marked,marked,{free,mode});if(cue)gameAudio.play(cue);}
 },[cardKey,marked,free,mode,active]);
 async function toggleSound(){
  const on=gameAudio.setEnabled(!enabled);setAudioNotice('');
  if(on){const ready=await gameAudio.unlock();if(ready)gameAudio.play('mark');else{gameAudio.setEnabled(false);setAudioNotice('Sound is unavailable in this browser right now.');}}
 }
 const message=progress.blackout?'Every square. A perfect ending.':mode==='blackout'?`${25-new Set(marked).size} squares to blackout`:progress.lines?`${progress.lines} ${progress.lines===1?'line':'lines'} — take a bow!`:progress.remaining===1?'One square from Bingo!':`${progress.remaining} squares from your closest line`;
 return <div className="game-feel" ref={anchor}>
  <div className="game-feel-progress"><span className="game-feel-lights" aria-hidden="true">✦ · ✦ · ✦</span><span role="status" className={progress.remaining===1&&!progress.lines?'one-away':''}>{message}</span></div>
  <div className="game-feel-controls"><button type="button" className="sound-toggle" disabled={!gameAudio.supported()} aria-pressed={enabled} onClick={toggleSound}>{gameAudio.supported()?(enabled?'Sound on':'Sound off'):'Sound unavailable'}</button><button type="button" onClick={()=>reveal(true)}>Replay reveal</button></div>
  {audioNotice&&<small role="status">{audioNotice}</small>}
 </div>;
}
