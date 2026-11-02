import test from 'node:test';
import assert from 'node:assert/strict';
import {startRoomPolling} from '../src/services/roomPolling.mjs';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function harness(){const win=new EventTarget(),doc=new EventTarget();doc.visibilityState='visible';win.setInterval=()=>1;win.clearInterval=()=>{};return {win,doc}}
test('returning from another mobile app aborts a suspended read and reconnects immediately',async()=>{
 const {win,doc}=harness(),requests=[],data=[];
 const stop=startRoomPolling({window:win,document:doc,read:signal=>new Promise(resolve=>requests.push({signal,resolve})),onData:value=>data.push(value),onError:error=>assert.fail(error.message)});
 assert.equal(requests.length,1);doc.visibilityState='hidden';doc.dispatchEvent(new Event('visibilitychange'));assert.equal(requests[0].signal.aborted,true);
 doc.visibilityState='visible';doc.dispatchEvent(new Event('visibilitychange'));assert.equal(requests.length,2);
 requests[1].resolve({revision:3});await tick();requests[0].resolve({revision:1});await tick();assert.deepEqual(data,[{revision:3}]);
 win.dispatchEvent(new Event('pageshow'));assert.equal(requests.length,3);stop();assert.equal(requests[2].signal.aborted,true);
});
test('focus and connection recovery restart reads; unmount removes every listener',async()=>{
 const {win,doc}=harness();let reads=0,errors=0;
 const stop=startRoomPolling({window:win,document:doc,read:async()=>{reads++;throw Error('offline')},onData:()=>{},onError:()=>errors++});await tick();
 win.dispatchEvent(new Event('online'));await tick();win.dispatchEvent(new Event('focus'));await tick();assert.equal(reads,3);assert.equal(errors,3);
 stop();win.dispatchEvent(new Event('online'));doc.dispatchEvent(new Event('visibilitychange'));await tick();assert.equal(reads,3);
});
