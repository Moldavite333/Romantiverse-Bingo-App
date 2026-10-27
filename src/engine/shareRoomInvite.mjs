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
 // Start BOTH methods during the original click activation. Some Samsung
 // browsers report execCommand('copy') success without updating the clipboard;
 // trying the modern API too avoids trusting that legacy result alone.
 // Never await one method before starting the other: Android may revoke the
 // transient user gesture while the first permission promise is pending.
 let modern=null;
 if(typeof nav?.clipboard?.writeText==='function'){
  try{modern=Promise.resolve(nav.clipboard.writeText(value.href)).then(()=>true,()=>false)}
  catch{modern=Promise.resolve(false)}
 }
 let legacy=false;
 if(selectText(input,doc)){
  try{legacy=doc.execCommand?.('copy')===true}catch{}
 }
 if(modern&&await modern)return 'copied';
 if(legacy)return 'copied';
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
