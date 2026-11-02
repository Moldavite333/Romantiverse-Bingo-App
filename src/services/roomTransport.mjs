// Keep network failures bounded on unreliable mobile connections.
// Never automatically retry a write: a timed-out create, join, or mark may
// already have reached the server, so retrying could duplicate or undo it.
export async function postRoomAction(url, payload, {fetcher=globalThis.fetch, timeoutMs=12000,signal}={}) {
  const controller=new AbortController();
  const cancel=()=>controller.abort();
  signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try {
    let response;
    try {
      response=await fetcher(url,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload),
        signal:controller.signal
      });
    } catch (error) {
      if(signal?.aborted)throw Object.assign(Error('Room read cancelled'),{name:'AbortError'});
      if(controller.signal.aborted) {
        throw Error('Room request timed out. Check your connection and refresh the room before trying again.');
      }
      throw Error('Could not reach the game service. Check your connection and try again.');
    }
    let data;
    try { data=await response.json(); }
    catch { throw Error('Could not read the room response'); }
    if(!response.ok)throw Error(typeof data?.error==='string'&&data.error?data.error:'Room request failed');
    return data;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort',cancel);
  }
}
