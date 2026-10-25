// Only display externally hosted posters after an editor has checked reuse rights.
// A URL returned by a metadata API is not, by itself, permission to publish artwork.
const APPROVED_HOSTS=new Set(['image.tmdb.org','upload.wikimedia.org']);
export function approvedMoviePoster(movie){
 const rights=movie?.poster_rights;
 if(rights?.status!=='approved'||typeof rights.credit!=='string')return null;
 const credit=rights.credit.trim();
 if(!credit||credit.length>160||typeof movie.poster_url!=='string')return null;
 try{
  const url=new URL(movie.poster_url);
  if(url.protocol!=='https:'||url.username||url.password||url.port||!APPROVED_HOSTS.has(url.hostname))return null;
  if(url.hostname==='image.tmdb.org'&&!/^\/t\/p\/(?:w\d+|original)\/[A-Za-z0-9_.-]+$/.test(url.pathname))return null;
  if(url.hostname==='upload.wikimedia.org'&&!url.pathname.startsWith('/wikipedia/commons/'))return null;
  return {url:url.href,credit};
 }catch{return null}
}
