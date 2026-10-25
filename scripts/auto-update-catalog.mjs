// Automatic conservative import from open Wikidata metadata only.
// Do not import synopsis prose, speculative networks, or unverified plot details.
import fs from 'node:fs';
import {discoverWikidata} from './sources/wikidata.mjs';
import {extractStoryFacts} from '../src/engine/storyFacts.mjs';
import {seasonalThemeFromTitle} from '../src/engine/seasonalTitle.mjs';
export {seasonalThemeFromTitle};
export function isHallmarkNetwork(value){
 return /^(hallmark channel|hallmark movies (?:&|and) mysteries|hallmark mystery|hallmark family)$/i.test(String(value||'').trim());
}
export function prepareOpenDataMovie(candidate){
 if(candidate.source!=='wikidata'||!/^Q\d+$/.test(candidate.source_id||'')||!isHallmarkNetwork(candidate.network))return null;
 const title=String(candidate.title||'').trim();
 const year=Number(candidate.release_year);
 if(!title||title.length>250||!Number.isInteger(year)||year<2000||year>2100)return null;
 // Unknown-season films remain discoverable without inventing Christmas or Fall metadata.
 const season=seasonalThemeFromTitle(title)||'Unspecified';
 return {id:'wikidata-'+candidate.source_id,title,release_year:year,season,story_facts:extractStoryFacts(title),
  facts_status:'title_only_unverified',verification_status:'unverified',source_name:'Wikidata (CC0)',
  source_url:'https://www.wikidata.org/wiki/'+candidate.source_id,network:candidate.network,is_demo:false};
}
export function mergeVerifiedNetworkMetadata(catalog,candidates){
 const byId=new Map(catalog.movies.map(m=>[m.id,m]));
 const keys=new Set(catalog.movies.map(m=>m.title.toLowerCase().trim()+'|'+m.release_year));
 let added=0;
 for(const candidate of candidates){
  const m=prepareOpenDataMovie(candidate);if(!m)continue;
  const key=m.title.toLowerCase().trim()+'|'+m.release_year;
  if(byId.has(m.id)||keys.has(key))continue;
  byId.set(m.id,m);keys.add(key);added++;
 }
 return {catalog:{...catalog,movies:[...byId.values()].sort((a,b)=>a.title.localeCompare(b.title))},added};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const catalogPath='public/catalog/movies.json';
 const current=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
 const candidates=await discoverWikidata();
 const {catalog,added}=mergeVerifiedNetworkMetadata(current,candidates);
 if(added){
  catalog.updated_at=new Date().toISOString().slice(0,10);
  fs.writeFileSync(catalogPath,JSON.stringify(catalog,null,2)+'\n');
 }
 console.log('Network-qualified Hallmark films added: '+added+'. Unknown seasons remain Unspecified; no synopsis stored.');
}
