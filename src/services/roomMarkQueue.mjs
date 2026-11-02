// Serialize intentional taps with the latest confirmed revision. An uncertain
// write is never retried: refresh server state before accepting more taps.
export function createRoomMarkQueue({send,getRevision,onData,onPending,onError}){
 let queue=[],running=false,disposed=false;
 const publish=()=>{if(!disposed)onPending([...queue])};
 async function drain(){
  if(running||disposed)return;running=true;
  try{while(queue.length&&!disposed){
   const data=await send(queue[0],getRevision());
   if(disposed)return;onData(data);queue.shift();publish();
  }}catch(error){queue=[];publish();if(!disposed)await onError(error)}
  finally{running=false;publish()}
 }
 return {enqueue(index){if(disposed||!Number.isInteger(index)||index<0||index>24||index===12)return;queue.push(index);publish();void drain()},dispose(){disposed=true;queue=[]}};
}
