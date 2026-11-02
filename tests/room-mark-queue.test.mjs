import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoomMarkQueue} from '../src/services/roomMarkQueue.mjs';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('rapid taps and undo are serialized without dropping taps or reusing old revisions',async()=>{
 let revision=0;const requests=[],pending=[];
 const queue=createRoomMarkQueue({send:(index,version)=>new Promise(resolve=>requests.push({index,version,resolve})),getRevision:()=>revision,onData:data=>{revision=data.revision},onPending:value=>pending.push(value),onError:error=>assert.fail(error.message)});
 queue.enqueue(0);queue.enqueue(1);queue.enqueue(0);assert.equal(requests.length,1);
 requests[0].resolve({revision:1});await tick();assert.equal(requests[1].index,1);assert.equal(requests[1].version,1);
 requests[1].resolve({revision:2});await tick();assert.equal(requests[2].index,0);assert.equal(requests[2].version,2);
 requests[2].resolve({revision:3});await tick();assert.deepEqual(pending.at(-1),[]);assert.equal(requests.length,3);
});
test('a failed uncertain write is not retried and queued taps are explicitly abandoned',async()=>{
 let sends=0,errors=0,last;
 const queue=createRoomMarkQueue({send:async()=>{sends++;throw Error('offline')},getRevision:()=>0,onData:()=>assert.fail('unconfirmed mark'),onPending:value=>last=value,onError:async()=>{errors++}});
 queue.enqueue(0);queue.enqueue(1);await tick();assert.equal(sends,1);assert.equal(errors,1);assert.deepEqual(last,[]);
});
test('leaving the screen prevents a late response from changing another game',async()=>{
 let resolve,updates=0;
 const queue=createRoomMarkQueue({send:()=>new Promise(r=>resolve=r),getRevision:()=>0,onData:()=>updates++,onPending:()=>{},onError:()=>{}});
 queue.enqueue(0);queue.dispose();resolve({revision:1});await tick();assert.equal(updates,0);
});
