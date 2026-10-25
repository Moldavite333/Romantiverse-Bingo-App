// Public, no-key movie-title discovery for titles missing from our curated catalog.
// Wikidata's search API returns labels/descriptions under CC0. We do not store
// descriptions or treat search matches as confirmed movie plot facts.
import {seasonalThemeFromTitle} from '../engine/seasonalTitle.mjs';
const ENDPOINT='https://www.wikidata.org/w/api.php';

// Wikidata searches include people, albums, TV series and film-industry topics.
// Require an actual film/movie description, not merely "Christmas" or "Hallmark".
export function isMovieDescription(value){
 const description=String(value||'').trim();
 if(!/\b(?:films?|movies?)\b/i.test(description))return false;
 if(/\b(?:film|movie|television)\s+(?:director|producer|actor|actress|studio|festival|series|franchise|award|genre|character|soundtrack|score|company|poster|trailer|distributor)\b/i.test(description))return false;
 if(/\b(?:actor|actress|filmmaker|screenwriter|cinematographer|singer|musician)\b/i.test(description))return false;
 return true;
}

export function normalizeMovieSearchResults(payload){
 const entries=Array.isArray(payload?.search)?payload.search:[];
 const results=[],seen=new Set();
 for(const x of entries){
  if(!/^Q\d+$/.test(x?.id||'')||seen.has(x.id)||typeof x.label!=='string'||!isMovieDescription(x.description))continue;
  const title=x.label.trim();
  if(!title||title.length>250)continue;
  seen.add(x.id);
  const description=String(x.description||'');
  const yearMatch=description.match(/\b(?:19|20)\d{2}\b/);
  const year=yearMatch?Number(yearMatch[0]):null;
  // Unknown titles remain searchable, but the player must choose a card theme.
  const season=seasonalThemeFromTitle(title)||'Unspecified';
  results.push({id:'wikidata-'+x.id,title,release_year:year,season,story_facts:{setting:[],relationship:[],conflict:[],event:[]},
   verification_status:'search_result_unverified',facts_status:'title_only_unverified',source_name:'Wikidata',
   source_url:'https://www.wikidata.org/wiki/'+x.id,is_demo:false,kind:'PUBLIC MOVIE SEARCH · SCENES UNVERIFIED'});
  if(results.length===12)break;
 }
 return results;
}
export async function searchPublicMovies(query,{signal,fetcher=fetch}={}){
 const q=String(query||'').trim().slice(0,120);
 if(q.length<3)return [];
 const params=new URLSearchParams({action:'wbsearchentities',search:q,language:'en',uselang:'en',type:'item',limit:'50',format:'json',origin:'*'});
 const response=await fetcher(ENDPOINT+'?'+params.toString().replace(/origin=\*/g,'origin=%2A'),{signal});
 if(!response.ok)throw Error('Public movie search temporarily unavailable');
 return normalizeMovieSearchResults(await response.json());
}
