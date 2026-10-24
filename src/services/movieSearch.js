// Public, no-key movie-title discovery for titles missing from our curated catalog.
// Wikidata's search API returns labels/descriptions under CC0. We do not store
// descriptions or treat search matches as confirmed movie plot facts.
const ENDPOINT='https://www.wikidata.org/w/api.php';
export function normalizeMovieSearchResults(payload){
 const entries=Array.isArray(payload?.search)?payload.search:[];
 return entries.filter(x=>/^Q\d+$/.test(x.id||'')&&typeof x.label==='string'&&
   /(?:\bfilm\b|\bmovie\b|television film|romantic comedy|christmas film|hallmark)/i.test(x.description||''))
 .slice(0,12).map(x=>{
   const description=String(x.description||'');
   const yearMatch=description.match(/\b(?:19|20)\d{2}\b/);
   const year=yearMatch?Number(yearMatch[0]):null;
   const title=x.label.trim();
   const season=/christmas|holiday|mistletoe|santa|winter/i.test(title)?'Christmas':/fall|autumn|harvest|pumpkin/i.test(title)?'Fall':'Christmas';
   return {id:'wikidata-'+x.id,title,release_year:year,season,story_facts:{setting:[],relationship:[],conflict:[],event:[]},
     verification_status:'search_result_unverified',facts_status:'title_only_unverified',source_name:'Wikidata',
     source_url:'https://www.wikidata.org/wiki/'+x.id,is_demo:false,kind:'PUBLIC MOVIE SEARCH · SCENES UNVERIFIED'};
 });
}
export async function searchPublicMovies(query,{signal,fetcher=fetch}={}){
 const q=String(query||'').trim().slice(0,120);
 if(q.length<3)return [];
 const params=new URLSearchParams({action:'wbsearchentities',search:q,language:'en',uselang:'en',type:'item',limit:'25',format:'json',origin:'*'});
 const response=await fetcher(ENDPOINT+'?'+params.toString(),{signal});
 if(!response.ok)throw Error('Public movie search temporarily unavailable');
 return normalizeMovieSearchResults(await response.json());
}
