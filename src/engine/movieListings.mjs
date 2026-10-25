// Build a single public movie list from independent catalogs without mixing in private HQ data.
// Groups are ordered by priority: locally curated titles, bundled catalog, remote catalog,
// fictional demos, then public search results. Earlier entries win ties.
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
   if(prior.some(existing=>existing===year||existing===null||year===null))continue;
   result.push(movie);
   prior.push(year);
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
