// Static-first catalog: no login, Supabase, API subscription, or runtime billing.
const BASE=import.meta.env?.BASE_URL||'/';
const SEASONS=new Set(['Christmas','Fall','Horror','Unspecified']);
const FACT_KEYS=['setting','relationship','conflict','event'];
function normalizeMovie(m){
 if(!m||typeof m!=='object'||Array.isArray(m)||typeof m.title!=='string')return null;
 const title=m.title.trim().replace(/\s+/g,' ');
 if(!title||title.length>200||!SEASONS.has(m.season))return null;
 if(m.release_year!==undefined&&(!Number.isInteger(m.release_year)||m.release_year<1900||m.release_year>2100))return null;
 const story_facts=Object.fromEntries(FACT_KEYS.map(key=>[key,Array.isArray(m.story_facts?.[key])?m.story_facts[key].filter(v=>typeof v==='string'&&/^[a-z0-9_]{1,80}$/.test(v)).slice(0,30):[]]));
 // Preserve editorially verified metadata without claiming that movie scenes
 // or Bingo tropes were observed. A bare URL or legacy `verified` flag alone
 // must not upgrade unverified records.
 const sourced=typeof m.source_url==='string'&&/^https:\/\/[^/\s?#]+(?:[/?#]|$)/i.test(m.source_url);
 const metadataVerified=sourced&&m.verification_status==='metadata_verified';
 const sceneVerified=sourced&&m.verification_status==='scene_verified'&&m.facts_status==='scene_verified';
 const verification_status=sceneVerified?'scene_verified':metadataVerified?'metadata_verified':'unverified';
 return {...m,title,season:m.season,verification_status,story_facts,is_demo:false};
}
export function validateStaticMovies(body){
 if(body?.version!==1||!Array.isArray(body.movies))throw Error('Unsupported catalog format');
 const seen=new Set(),items=[];
 for(const raw of body.movies){
  const movie=normalizeMovie(raw);
  if(!movie)continue;
  const key=movie.title.normalize('NFKC').toLocaleLowerCase('en')+'|'+(movie.release_year??'');
  if(seen.has(key))continue;
  seen.add(key);items.push(movie);
 }
 return items;
}
export async function loadStaticCatalog({signal}={}){
 const res=await fetch(BASE+'catalog/movies.json',{signal,cache:'no-cache'});
 if(!res.ok)throw Error('Catalog file unavailable ('+res.status+')');
 const body=await res.json();
 return {items:validateStaticMovies(body),source:'bundled-static',updatedAt:body.updated_at};
}
