// Samsung Internet, Chrome and Android WebViews differ in clipboard permissions.
// A selectable, visible input remains the final fallback; never pretend a copy succeeded.
export async function copyRoomInvite(url,{nav=globalThis.navigator,doc=globalThis.document,input=null}={}){
 const value=String(url||'');
 const parsed=new URL(value);
 if(!['https:','http:'].includes(parsed.protocol))throw Error('Invalid invitation link');
 if(typeof nav?.clipboard?.writeText==='function'){
  try{await nav.clipboard.writeText(value);return 'copied'}catch{}
 }
 if(input&&doc){
  try{
   input.focus({preventScroll:true});
   input.select();
   input.setSelectionRange?.(0,value.length);
   if(doc.execCommand?.('copy')===true)return 'copied';
  }catch{}
 }
 return 'manual';
}
export async function shareRoomInvite(url,movieTitle,{nav=globalThis.navigator,doc=globalThis.document,input=null}={}){
 const title='Romantiverse Bingo — '+String(movieTitle||'Movie Night').slice(0,200);
 const text='Join my Romantiverse Bingo game!\n'+url;
 if(typeof nav?.share==='function'){
  try{await nav.share({title,text,url});return 'shared'}
  catch(error){if(error?.name==='AbortError')return 'cancelled'}
 }
 return copyRoomInvite(url,{nav,doc,input});
}
