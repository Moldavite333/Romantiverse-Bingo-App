import test from 'node:test';
import assert from 'node:assert/strict';
import {postRoomAction} from '../src/services/roomTransport.mjs';

test('room transport sends a single POST and preserves private session data only in the request',async()=>{
  const requests=[];
  const payload={action:'mark',code:'ABC2345',token:'private-session-token',index:4,revision:1};
  const result=await postRoomAction('https://example.test/game-room',payload,{fetcher:async(url,options)=>{
    requests.push({url,options});
    return {ok:true,json:async()=>({revision:2,marked:[4,12]})};
  }});
  assert.deepEqual(result,{revision:2,marked:[4,12]});
  assert.equal(requests.length,1);
  assert.equal(requests[0].options.method,'POST');
  assert.deepEqual(JSON.parse(requests[0].options.body),payload);
  assert.ok(requests[0].options.signal instanceof AbortSignal);
});

test('timeout aborts an outstanding request without an automatic retry',async()=>{
  let count=0;
  const fetcher=(_url,{signal})=>new Promise((_resolve,reject)=>{
    count++;
    signal.addEventListener('abort',()=>reject(Object.assign(new Error('aborted'),{name:'AbortError'})),{once:true});
  });
  await assert.rejects(postRoomAction('https://example.test/game-room',{action:'create'},{fetcher,timeoutMs:10}),/timed out/);
  assert.equal(count,1);
});

test('network and server errors are distinct and never leak raw transport details',async()=>{
  await assert.rejects(postRoomAction('https://example.test/game-room',{action:'state'},{fetcher:async()=>{throw Error('private-host.internal')}}),/Could not reach the game service/);
  await assert.rejects(postRoomAction('https://example.test/game-room',{action:'join'},{fetcher:async()=>({ok:false,json:async()=>({error:'Room is full'})})}),/Room is full/);
  await assert.rejects(postRoomAction('https://example.test/game-room',{action:'state'},{fetcher:async()=>({ok:true,json:async()=>{throw Error('invalid json')}})}),/Could not read the room response/);
});
