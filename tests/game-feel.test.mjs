import test from 'node:test';
import assert from 'node:assert/strict';
import {feedbackCue,gameProgress} from '../src/engine/gameFeel.mjs';
import {createGameAudio,SOUND_KEY} from '../src/engine/gameAudio.mjs';
test('feedback follows confirmed marks, reversible undo and actual completed lines',()=>{
 assert.equal(feedbackCue([12],[12,0]),'mark');
 assert.equal(feedbackCue([12,0,1,2],[12,0,1,2,3]),'near');
 assert.equal(feedbackCue([12,0,1,2,3],[12,0,1,2,3,4]),'win');
 assert.equal(feedbackCue([12,0],[12]),'undo');
 assert.equal(feedbackCue([12],[12]),null);
 assert.equal(gameProgress([0,6,18],true).remaining,1);
 assert.equal(gameProgress([0,6,18],false).remaining,2);
});
test('blackout cues follow the blackout goal without claiming an early win',()=>{
 assert.equal(feedbackCue([12,0,1,2,3],[12,0,1,2,3,4],{mode:'blackout'}),'mark');
 const all=Array.from({length:25},(_,i)=>i);
 assert.equal(feedbackCue(all.slice(0,23),all.slice(0,24),{mode:'blackout'}),'near');
 assert.equal(feedbackCue(all.slice(0,24),all,{mode:'blackout'}),'blackout');
});
test('sound stays silent until enabled and unlocked; mute cancels queued notes',async()=>{
 let created=0,started=0,stopped=0;
 const param={setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}};
 class Context{
  constructor(){created++;this.state='suspended';this.currentTime=0;this.destination={}}
  async resume(){this.state='running'}
  createGain(){return {gain:{...param},connect(){},disconnect(){}}}
  createOscillator(){return {frequency:{},connect(){},disconnect(){},start(){started++},stop(){stopped++}}}
 }
 const values=new Map(),host={AudioContext:Context,document:{hidden:false},localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}};
 const audio=createGameAudio(host);
 assert.equal(await audio.play('win'),false);assert.equal(created,0);
 audio.setEnabled(true);assert.equal(created,0);
 assert.equal(await audio.play('win'),false);
 assert.equal(await audio.unlock(),true);assert.equal(created,1);
 assert.equal(await audio.play('mark'),true);assert.equal(started,2);
 audio.setEnabled(false);assert.ok(stopped>=4);assert.equal(values.get(SOUND_KEY),'false');
 assert.equal(await audio.play('win'),false);assert.equal(started,2);
 audio.setEnabled(true);host.document.hidden=true;assert.equal(await audio.play('win'),false);
});
test('unavailable audio and denied preference storage never interfere with play',async()=>{
 const audio=createGameAudio({localStorage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}}});
 assert.equal(audio.supported(),false);assert.equal(audio.setEnabled(true),false);assert.equal(await audio.unlock(),false);assert.equal(await audio.play('win'),false);
});
