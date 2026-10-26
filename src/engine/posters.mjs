// Display catalog-supplied movie poster thumbnails from recognized image hosts.
// Metadata providers do not own underlying poster copyrights. Keep images tied to
// movie identification and reviews; do not use for merchandise or endorsement.
const HOSTS=new Set(['image.tmdb.org','upload.wikimedia.org']);
export function approvedMoviePoster(movie){
 if(typeof movie?.poster_url!=='string')return null;
 try{
  const url=new URL(movie.poster_url);
  if(url.protocol!=='https:'||url.username||url.password||url.port||!HOSTS.has(url.hostname))return null;
  if(url.hostname==='image.tmdb.org'&&!/^\\/t\\/p\\/(?:w\\d+|original)\\/[A-Za-z0-9_.-]+$/.test(url.pathname))return null;
  if(url.hostname==='upload.wikimedia.org'&&!url.pathname.startsWith('/wikipedia/commons/'))return null;
  const credit=typeof movie.poster_rights?.credit==='string'&&movie.poster_rights.credit.trim()?movie.poster_rights.credit.trim().slice(0,160):url.hostname==='image.tmdb.org'?'Poster via TMDB · Artwork belongs to its respective rights holders':'Poster via Wikimedia Commons';
  return {url:url.href,credit};
 }catch{return null}
}
