export const SOUND_KEY='romantiverse-sound-enabled';
export const CUES=Object.freeze({
 mark:[[659.25,0,.09],[880,.055,.12]],undo:[[392,0,.09]],
 deal:[[261.63,0,.09],[329.63,.09,.09],[392,.18,.09],[523.25,.27,.11],[783.99,.39,.2]],
 near:[[523.25,0,.12],[659.25,.13,.12],[783.99,.26,.22]],
 win:[[523.25,0,.15],[659.25,.13,.15],[783.99,.26,.17],[1046.5,.44,.3],[783.99,.78,.15],[1046.5,.96,.45]],
 blackout:[[523.25,0,.13],[659.25,.12,.13],[783.99,.24,.13],[1046.5,.4,.23],[1318.51,.66,.22],[1567.98,.9,.55]]
});

export function createGameAudio(host=globalThis){
 let enabled=false,context=null,master=null;
 let warming=null;const samples=new Map();
 const listeners=new Set(),voices=new Set();
 try{enabled=host.localStorage?.getItem(SOUND_KEY)==='true'}catch{}
 const supported=()=>Boolean(host.AudioContext||host.webkitAudioContext);
 function hush(){for(const voice of voices){try{voice.stop()}catch{}}voices.clear()}
 function setEnabled(value){
  enabled=Boolean(value)&&supported();if(!enabled)hush();
  try{host.localStorage?.setItem(SOUND_KEY,String(enabled))}catch{}
  for(const fn of listeners)fn();return enabled;
 }
 // Called only from a real button/board gesture, never from mount or restoration.
 async function unlock(){
  if(!enabled||!supported())return false;
  try{
   if(!context){const Context=host.AudioContext||host.webkitAudioContext;context=new Context();master=context.createGain();master.gain.value=.1;master.connect(context.destination);}
   if(context.state!=='running')await context.resume();
   if(!warming&&host.fetch&&context.decodeAudioData)warming=Promise.allSettled(Object.keys(CUES).map(async cue=>{
    const response=await host.fetch('/audio/'+(cue==='win'?'win-grand':cue)+'.ogg',{signal:host.AbortSignal?.timeout(4000)});
    if(!response.ok)throw Error('Audio unavailable');
    const buffer=await context.decodeAudioData(await response.arrayBuffer());samples.set(cue,buffer);
   }));
   if(warming)await warming;
   return enabled&&context.state==='running';
  }catch{return false}
 }
 async function play(cue){
  if(!enabled||!context||host.document?.hidden||!CUES[cue])return false;
  try{
   if(context.state!=='running')await context.resume();
   if(!enabled||context.state!=='running'||host.document?.hidden)return false;
   if(cue==='win'||cue==='blackout')hush();
   while(voices.size>=8){const oldest=voices.values().next().value;try{oldest.stop()}catch{}voices.delete(oldest)}
   if(samples.has(cue)){
    const voice=context.createBufferSource(),fanfareGain=cue==='win'?context.createGain():null;voice.buffer=samples.get(cue);
    if(fanfareGain){fanfareGain.gain.value=1.5;voice.connect(fanfareGain);fanfareGain.connect(master)}else voice.connect(master);
    voices.add(voice);
    voice.onended=()=>{voices.delete(voice);voice.disconnect();fanfareGain?.disconnect()};voice.start();return true;
   }
   const now=context.currentTime;
   for(const [frequency,delay,duration] of CUES[cue]){
    while(voices.size>=12){const oldest=voices.values().next().value;try{oldest.stop()}catch{}voices.delete(oldest)}
    const voice=context.createOscillator(),gain=context.createGain(),start=now+delay;
    voice.type='sine';voice.frequency.value=frequency;
    gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.65,start+.008);gain.gain.exponentialRampToValueAtTime(.001,start+duration);
    voice.connect(gain);gain.connect(master);voices.add(voice);
    voice.onended=()=>{voices.delete(voice);voice.disconnect();gain.disconnect()};
    voice.start(start);voice.stop(start+duration+.015);
   }
   return true;
  }catch{return false}
 }
 return {get enabled(){return enabled},supported,setEnabled,unlock,play,hush,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)}};
}
export const gameAudio=createGameAudio();
