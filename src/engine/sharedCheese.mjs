// Public-safe, portable Cheese Louise classifications. No synopsis, account IDs or personal notes.
import {validateStoryFacts} from './storyFacts.mjs';
const safeText=(v,n=160)=>String(v||'').trim().slice(0,n);
export function validateCheesePackage(input){
 if(input?.format!=='cheese-louise-bingo-v1'||!Array.isArray(input.movies)||!Array.isArray(input.traits))throw Error('Unsupported Cheese Louise package');
 if(input.movies.length>10000||input.traits.length>2000)throw Error('Package too large');
 const traits=input.traits.map(t=>({id:safeText(t.id,90),label:safeText(t.label,120),category:safeText(t.category,60),points:Number.isFinite(Number(t.points))?Number(t.points):0})).filter(t=>t.id&&t.label);
 const allowed=new Set(traits.map(t=>t.id));
 const movies=input.movies.map(m=>({
  id:safeText(m.id,120),title:safeText(m.title,250),release_year:Number(m.release_year)||null,
  season:['Christmas','Fall','Horror'].includes(m.season)?m.season:'Christmas',
  story_facts:validateStoryFacts(m.story_facts),
  cheese_trait_ids:[...new Set(Array.isArray(m.cheese_trait_ids)?m.cheese_trait_ids.filter(id=>allowed.has(id)):[])],
  is_demo:false,source_name:'Cheese Louise approved export'
 })).filter(m=>m.id&&m.title);
 return {format:'cheese-louise-bingo-v1',traits,movies};
}
export function buildSharedCheeseSuggestions(movie,library){
 const ids=new Set(movie.cheese_trait_ids||[]);
 return (library||[]).filter(t=>ids.has(t.id)).map(t=>({
  id:'cl-'+t.id,label:t.label,category:'cheese',confidence:.92,
  reason:'Cheese Louise editorially selected trait; scene still unverified for this playthrough',
  evidence:'editorial',verified:false,observable_trigger:t.label
 }));
}
