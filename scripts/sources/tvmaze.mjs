// TVmaze is a supplemental TV-series source, not a comprehensive TV-movie catalog.
// Requires attribution and compliance with TVmaze's CC BY-SA licensing.
// This module NEVER publishes results directly to the game.
const API='https://api.tvmaze.com';
export async function lookupTVmaze(query,{fetcher=fetch}={}){
 const q=String(query||'').trim();if(q.length<3||q.length>120)throw Error('Search must be 3–120 characters');
 const response=await fetcher(API+'/search/shows?q='+encodeURIComponent(q),{headers:{Accept:'application/json','User-Agent':'RomantiverseBingoCatalogResearch/1.0'}});
 if(!response.ok)throw Error('TVmaze request failed ('+response.status+')');
 const data=await response.json();if(!Array.isArray(data))throw Error('Unexpected TVmaze response');
 return data.slice(0,25).map(({show})=>({
  source:'tvmaze',source_id:show?.id,source_url:show?.url||null,
  title:String(show?.name||''),type:show?.type||null,
  premiered:show?.premiered||null,
  network:show?.network?.name||show?.webChannel?.name||null,
  // TVmaze show summaries may contain HTML. Do not inject them into the UI.
  synopsis:String(show?.summary||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,5000),
  attribution:'TVmaze (CC BY-SA); verify licensing and attribution before publication',
  editorial_status:'review_required'
 })).filter(x=>x.title&&Number.isInteger(x.source_id));
}
export function reviewCandidate(candidate,{expectedTitle,expectedYear}={}){
 const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const titleMatch=norm(candidate.title)===norm(expectedTitle);
 const yearMatch=!expectedYear||String(candidate.premiered||'').startsWith(String(expectedYear));
 // TVmaze search indexes TV shows; matches are only leads, never verified films.
 return {...candidate,title_match:titleMatch,year_match:yearMatch,
  suitable_for_auto_import:false,
  review_reason:'TVmaze primarily catalogs series; a matching title does not establish a Hallmark TV movie'};
}
