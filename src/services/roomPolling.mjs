// Reads may be replaced on mobile resume. Writes are never retried here.
export function startRoomPolling({read,onData,onError,onReconnect=()=>{},window:win=globalThis.window,document:doc=globalThis.document,intervalMs=3000}){
 let stopped=false,controller=null,generation=0;
 const visible=()=>doc?.visibilityState!=='hidden';
 async function poll(restart=false){
  if(stopped||!visible()||controller&&!restart)return;
  if(restart){controller?.abort();onReconnect()}
  const current=new AbortController(),request=++generation;controller=current;
  try{const data=await read(current.signal);if(!stopped&&request===generation)onData(data)}
  catch(error){if(!stopped&&request===generation&&!current.signal.aborted)onError(error)}
  finally{if(request===generation)controller=null}
 }
 const resume=()=>poll(true);
 const visibility=()=>{if(visible())resume();else{generation++;controller?.abort();controller=null}};
 const timer=win.setInterval(()=>poll(),intervalMs);
 for(const event of ['focus','pageshow','online'])win.addEventListener(event,resume);
 doc.addEventListener('visibilitychange',visibility);resume();
 return()=>{stopped=true;generation++;controller?.abort();win.clearInterval(timer);for(const event of ['focus','pageshow','online'])win.removeEventListener(event,resume);doc.removeEventListener('visibilitychange',visibility)};
}
