// Clipboard permissions vary across Samsung Internet, Chrome and Android WebViews.
// Keep both a selectable URL and a ready-to-send text invitation as fallbacks.
// Never report a copy as successful unless a supported copy method reports success.
export function roomInviteMessage(url,movieTitle='Movie Night',collection='Unspecified'){
 const link=new URL(String(url||''));
 if(!['https:','http:'].includes(link.protocol))throw Error('Invalid invitation link');
 const title=String(movieTitle||'Movie Night').trim().slice(0,200);
 const kind=String(collection||'Unspecified').trim().slice(0,40);
 const collectionText=kind&&kind!=='Unspecified'?' ('+kind+' collection)':'';
 return 'Join me for Romantiverse Bingo: '+title+collectionText+'! Enter your nickname and join my game: '+link.href+'\nBrought to you by Cheese Louise Podcast';
}
function selectText(input,doc){
 if(!input||!doc)return false;
 try{
  try{input.focus({preventScroll:true})}catch{input.focus()}
  input.select();
  input.setSelectionRange?.(0,String(input.value||'').length);
  return true;
 }catch{return false}
}
export async function copyRoomInvite(url,{nav=globalThis.navigator,doc=globalThis.document,input=null}={}){
 const value=new URL(String(url||''));
 if(!['https:','http:'].includes(value.protocol))throw Error('Invalid invitation link');
 // Try the legacy selection route *synchronously* in the click handler.
 // Waiting for a denied Clipboard API promise can lose transient user activation.
 if(selectText(input,doc)){
  try{if(doc.execCommand?.('copy')===true)return 'copied'}catch{}
 }
 if(typeof nav?.clipboard?.writeText==='function'){
  try{await nav.clipboard.writeText(value.href);return 'copied'}catch{}
 }
 selectText(input,doc);
 return 'manual';
}
export async function shareRoomInvite(url,movieTitle,{nav=globalThis.navigator,doc=globalThis.document,input=null,collection='Unspecified'}={}){
 const message=roomInviteMessage(url,movieTitle,collection);
 const title='Romantiverse Bingo — '+String(movieTitle||'Movie Night').slice(0,200);
 if(typeof nav?.share==='function'){
  try{
   // Text includes the link because some Android share targets omit the url field.
   await nav.share({title,text:message,url:new URL(url).href});
   return 'shared';
  }catch(error){if(error?.name==='AbortError')return 'cancelled'}
 }
 return copyRoomInvite(url,{nav,doc,input});
}
