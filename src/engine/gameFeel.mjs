import {LINES,winningLines} from './bingo.mjs';
export function gameProgress(marked,free=true){
 const marks=new Set(marked);if(free)marks.add(12);
 const lines=winningLines([...marks],free).length;
 const remaining=Math.min(...LINES.map(line=>line.filter(i=>!marks.has(i)).length));
 return {lines,remaining,blackout:marks.size===25};
}
export function feedbackCue(before,after,{free=true,mode='classic'}={}){
 const old=gameProgress(before,free),next=gameProgress(after,free);
 if(next.blackout&&!old.blackout)return 'blackout';
 if(mode!=='blackout'&&next.lines>old.lines)return 'win';
 if(after.length<before.length)return 'undo';
 if(after.length>before.length)return (mode==='blackout'?after.length===24:next.remaining===1&&old.remaining!==1&&next.lines===0)?'near':'mark';
 return null;
}
