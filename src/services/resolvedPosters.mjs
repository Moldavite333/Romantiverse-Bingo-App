// Public read-only poster cache. Provider lookups run server-side, not in visitors' browsers.
// The cache contains only title, year, and verified artwork; no Cheese Louise HQ records.
import {approvedMoviePoster} from '../engine/posters.mjs';
const URL='https://wgvsnmukiaobcbyqhkkt.supabase.co/functions/v1/bingo-public-posters';

export function normalizeResolvedPosters(payload){
 if(payload?.version!==1||!Array.isArray(payload.movies))throw Error('Invalid public poster cache');
 const out=[],seen=new Set();
 for(const row of payload.movies.slice(0,500)){
  const title=typeof row?.title==='string'?row.title.trim().replace(/\s+/g,' ').slice(0,250):'';
  const year=row?.release_year;
  const poster=approvedMoviePoster({poster_url:row?.poster_url});
  if(!title||!Number.isInteger(year)||year<1900||year>2100||!poster)continue;
  const key=title.normalize('NFKC').toLowerCase()+'|'+year;
  if(seen.has(key))continue;
  seen.add(key);
  out.push({id:'poster-cache-'+year+'-'+title.toLowerCase().replace(/[^a-z0-9]+/g,'-'),
   title,release_year:year,poster_url:poster.url,poster_source:'catalog_public',
   is_demo:false,verification_status:'metadata_verified',season:['Christmas','Fall','Horror'].includes(row.season)?row.season:'Unspecified',
   kind:'VERIFIED POSTER · SCENES UNVERIFIED',story_facts:{setting:[],relationship:[],conflict:[],event:[]}});
 }
 return out;
}

export async function loadResolvedPosters({signal,fetcher=fetch}={}){
 const response=await fetcher(URL,{method:'GET',headers:{Accept:'application/json'},signal,cache:'no-store'});
 if(!response.ok)throw Error('Public poster cache unavailable ('+response.status+')');
 return normalizeResolvedPosters(await response.json());
}
