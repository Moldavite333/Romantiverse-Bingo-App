// Build a single public movie list from independent catalogs without mixing in private HQ data.
// Groups are ordered by priority: locally curated titles, bundled catalog, remote catalog,
// fictional demos, then public search results. Earlier entries win ties.
// Later approved-host public-catalog artwork can enrich an exact title+year match, without
// overriding the selected movie identity, plot facts, or editorial priority.
import {approvedMoviePoster} from './posters.mjs';
function titleKey(title){
 return String(title||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en');
}
export function mergeMovieListings(groups){
 const result=[];
 const seen=new Map();
 for(const group of groups){
  for(const movie of Array.isArray(group)?group:[]){
   if(!movie||typeof movie.title!=='string'||!movie.title.trim())continue;
   const key=titleKey(movie.title);
   const year=Number.isInteger(movie.release_year)?movie.release_year:null;
   const prior=seen.get(key)||[];
   // Keep different known-year remakes; collapse same-year or unknown-year duplicates.
   const duplicate=prior.find(existing=>existing.year===year||existing.year===null||year===null);
   if(duplicate){
    const chosen=result[duplicate.index];
    // Enrich only exact known-year real titles. A deliberately HQ-locked
    // poster takes priority over automated artwork, never over movie facts.
    const sameYear=year!==null&&duplicate.year===year;
    const trustedHq=movie.poster_source==='hq_published';
    const approvedEnrichment=movie.poster_rights?.status==='approved'||movie.poster_source==='catalog_public';
    // Curated HQ selections may omit is_demo; a known-year exact match is safe
    // to enrich unless either record is explicitly fictional or a demo.
    const chosenIsReal=chosen.is_demo!==true&&!/DEMO/i.test(String(chosen.kind||''));
    const canEnrich=sameYear&&chosenIsReal&&movie.is_demo===false&&
      approvedMoviePoster(movie)&&(trustedHq||approvedEnrichment);
    if(canEnrich&&((trustedHq&&movie.poster_locked===true)||!approvedMoviePoster(chosen))){
     result[duplicate.index]={...chosen,poster_url:movie.poster_url,
      poster_rights:movie.poster_rights,poster_locked:trustedHq&&movie.poster_locked===true};
    }
    continue;
   }
   prior.push({year,index:result.length});
   result.push(movie);
   seen.set(key,prior);
  }
 }
 return result;
}
export function movieEvidenceLabel(movie){
 const kind=String(movie?.kind||'').toUpperCase();
 if(kind.includes('PUBLIC MOVIE SEARCH')||movie?.verification_status==='search_result_unverified')return 'PUBLIC SEARCH · TITLE UNVERIFIED';
 if(kind.includes('CHEESE LOUISE CURATED'))return 'CHEESE LOUISE CURATED · SCENES UNVERIFIED';
 if(kind.includes('CUSTOM'))return 'CUSTOM TITLE · SCENES UNVERIFIED';
 if(movie?.is_demo===true||kind.includes('DEMO'))return 'FICTIONAL DEMO';
 if(movie?.verification_status==='unverified')return 'CATALOG TITLE · SCENES UNVERIFIED';
 if(movie?.is_demo===false)return 'REAL TITLE · TROPES PREDICTED';
 return 'TITLE UNVERIFIED';
}


// Match the way visitors actually search: ignore accents and punctuation,
// allow words in any order, and include the verified release year.
// This only filters existing public movie metadata; it never invents movie facts.
function normalizeMovieSearchText(value){
 return String(value??'').normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase('en').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
}
export function matchesMovieQuery(movie,query){
 const terms=normalizeMovieSearchText(query).split(' ').filter(Boolean);
 if(!terms.length)return true;
 if(!movie||typeof movie.title!=='string')return false;
 const text=normalizeMovieSearchText([movie.title,Number.isInteger(movie.release_year)?movie.release_year:'',movie.synopsis||'',...Object.values(movie.story_facts||{}).flat()].join(' '));
 return terms.every(term=>text.includes(term));
}
