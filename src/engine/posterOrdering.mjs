// Put verified artwork first in the default movie browser without changing
// search relevance, movie identities, or editorial poster precedence.
import {approvedMoviePoster} from './posters.mjs';

export function orderMoviesForBrowsing(items,query=''){
 if(!Array.isArray(items))return [];
 if(String(query).trim())return items;
 return items.map((movie,index)=>({movie,index,hasPoster:Boolean(approvedMoviePoster(movie))}))
  .sort((a,b)=>Number(b.hasPoster)-Number(a.hasPoster)||a.index-b.index)
  .map(({movie})=>movie);
}
