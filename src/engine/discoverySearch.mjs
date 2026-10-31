// Public movie-search handoff from cheeselouisepod.com.
// Query parameters carry only a visitor-entered title, never a card, marks,
// room token, private HQ record, or other saved game state.
export function readDiscoverySearch(search){
 try{
  const params=new URLSearchParams(String(search||''));
  const values=params.getAll('search');
  if(values.length!==1)return '';
  return values[0].replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,120).trim();
 }catch{return ''}
}
