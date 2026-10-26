// Read-only public projection from HQ. The RPC includes ONLY movies that have
// deliberately published Bingo cards; private workspace tables remain RLS-protected.
import {approvedMoviePoster} from '../engine/posters.mjs';
const URL='https://wgvsnmukiaobcbyqhkkt.supabase.co/rest/v1/rpc/published_movie_posters';
const KEY='sb_publishable_3xcqfNu-mJPuDWivmlBXug_3Tw60QoM';
export function normalizePublishedPosters(rows){
 if(!Array.isArray(rows))throw Error('Invalid public HQ artwork response');
 const out=[];
 for(const row of rows.slice(0,100)){
  if(!row||typeof row.title!=='string')continue;
  const title=row.title.trim().slice(0,250);
  if(!title)continue;
  const release_year=Number.isInteger(row.release_year)&&row.release_year>=1900&&row.release_year<=2200?row.release_year:null;
  const season=['Christmas','Fall'].includes(row.season)?row.season:'Unspecified';
  const poster_url=approvedMoviePoster({poster_url:row.poster_url})?.url||null;
  out.push({
   id:'hq-published-'+out.length+'-'+title.toLowerCase().replace(/[^a-z0-9]+/g,'-'),
   title,release_year,season,poster_url,
   poster_locked:row.poster_locked===true,poster_source:'hq_published',
   is_demo:false,verification_status:'metadata_verified',
   kind:'CHEESE LOUISE PUBLISHED · SCENES UNVERIFIED',
   story_facts:{setting:[],relationship:[],conflict:[],event:[]}
  });
 }
 return out;
}
export async function loadPublishedMoviePosters({signal,fetcher=fetch}={}){
 const response=await fetcher(URL,{headers:{apikey:KEY,Accept:'application/json'},signal,cache:'no-store'});
 if(!response.ok)throw Error('Published HQ movie artwork unavailable ('+response.status+')');
 return normalizePublishedPosters(await response.json());
}
