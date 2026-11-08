// Original Romantiverse electronic jackpot cue. CC0-1.0; no external samples.
// Run from the repository root: node scripts/generate-jackpot.mjs
import {writeFile} from 'node:fs/promises';
const rate=44100,duration=5.2,samples=new Float64Array(Math.round(rate*duration));
const hz=midi=>440*2**((midi-69)/12);
function bell(midi,start,length,level=.16){
 const f=hz(midi);
 for(let i=0;i<Math.round(length*rate);i++){
  const t=i/rate,index=Math.round(start*rate)+i;if(index>=samples.length)break;
  const attack=Math.min(1,t/.006),release=Math.min(1,(length-t)/.06);
  const tone=Math.sin(2*Math.PI*f*t)*Math.exp(-3*t/length)
   +.32*Math.sin(2*Math.PI*f*2*t)*Math.exp(-6*t/length)
   +.12*Math.sin(2*Math.PI*f*4*t)*Math.exp(-10*t/length);
  samples[index]+=tone*attack*release*level;
 }
}
// Fast, ascending electronic win cycles; no reel noise, coins, brass or march.
const cycle=[72,76,79,84,76,79,84,88];
for(let n=0;n<24;n++)bell(cycle[n%8]+(n>=16?12:0),n*.075,.25,.15);
for(const start of [0,.6,1.2])for(const note of [48,60,64,67])bell(note,start,.48,.075);
// Two bright anticipatory accents, then a long major-sixth jackpot resolution.
for(const start of [1.86,2.08])for(const note of [67,71,74,77])bell(note,start,.2,.11);
for(const note of [48,60,64,67,72,76,81,86])bell(note,2.34,2.8,.12);
for(let n=0;n<12;n++)bell([84,88,91,93,96,100][n%6],2.4+n*.095,.7,.065);
let maximum=0;
for(const v of samples)maximum=Math.max(maximum,Math.abs(v));
const wav=Buffer.alloc(44+samples.length*2);
wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);
wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);
wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);
wav.write('data',36);wav.writeUInt32LE(samples.length*2,40);
for(let i=0;i<samples.length;i++)wav.writeInt16LE(Math.round(samples[i]/maximum*.72*32767),44+i*2);
await writeFile('public/audio/win-jackpot.wav',wav);
console.log(JSON.stringify({file:'win-jackpot.wav',duration,bytes:wav.length,peak:.72}));
