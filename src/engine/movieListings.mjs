// Build a single public movie list from independent catalogs without mixing in private HQ data.
// Groups are ordered by priority: locally curated titles, bundled catalog, remote catalog,
// fictional demos, then public search results. Earlier entries win ties.
// Later rights-cleared artwork can enrich an exact title+year match, without
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
    // Never assign artwork across ambiguous remakes or fictional demo entries.
    if(year!==null&&duplicate.year===year&&chosen.is_demo===false&&movie.is_demo===false&&
       !approvedMoviePoster(chosen)&&approvedMoviePoster(movie)){
     result[duplicate.index]={...chosen,poster_url:movie.poster_url,poster_rights:movie.poster_rights};
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
 if(movie?.is_demo===false)return 'REAL TITLE · TROPES PREDICTED';
 return 'TITLE UNVERIFIED';
}
