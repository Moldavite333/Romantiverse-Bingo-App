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
export function isEligibleNetwork(value){
 return isHallmarkNetwork(value)||/^(lifetime|lifetime movie network|lmn)$/i.test(String(value||'').trim());
}
export function isEligibleTvProducer(value){
 return /^(marvista entertainment|reel one entertainment)$/i.test(String(value||'').trim());
}
export function prepareOpenDataMovie(candidate){
 if(candidate.source!=='wikidata'||!/^Q\d+$/.test(candidate.source_id||''))return null;
 const network=String(candidate.network||'').trim();
 const company=String(candidate.production_company||'').trim();
 const qualifiedNetwork=isEligibleNetwork(network);
 // The query explicitly verifies P31=television film for P272 producer hits.
 // Producer-only items without that evidence must never become playable movies.
 const qualifiedProducer=isEligibleTvProducer(company)&&candidate.tv_film_evidence===true;
 if(!qualifiedNetwork&&!qualifiedProducer)return null;
 const title=String(candidate.title||'').trim();
 const year=Number(candidate.release_year);
 if(!title||/^Q\d+$/i.test(title)||title.length>250||
    !Number.isInteger(year)||year<2000||year>2100)return null;
 // Unknown-season films remain discoverable without inventing Christmas or Fall metadata.
 const season=seasonalThemeFromTitle(title)||'Unspecified';
 // Native Android catalog IDs accept lowercase ASCII slugs only. Wikidata's
 // canonical Q-prefixed IDs are uppercase, so normalize the generated slug.
 return {id:'wikidata-'+candidate.source_id.toLowerCase(),title,release_year:year,season,story_facts:extractStoryFacts(title),
  facts_status:'title_only_unverified',verification_status:'unverified',source_name:'Wikidata (CC0)',
  source_url:'https://www.wikidata.org/wiki/'+candidate.source_id,
  ...(qualifiedNetwork?{network}:{}),
  ...(qualifiedProducer?{production_company:company}:{}),
  is_demo:false};
}
export function mergeSourceQualifiedMetadata(catalog,candidates){
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
// Retain the earlier export for downstream scripts that imported this helper.
export const mergeVerifiedNetworkMetadata=mergeSourceQualifiedMetadata;
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const catalogPath='public/catalog/movies.json';
 const current=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
 const candidates=await discoverWikidata();
 const {catalog,added}=mergeSourceQualifiedMetadata(current,candidates);
 if(added){
  catalog.updated_at=new Date().toISOString().slice(0,10);
  fs.writeFileSync(catalogPath,JSON.stringify(catalog,null,2)+'\n');
 }
 console.log('Source-qualified TV movies added: '+added+'. Unknown seasons remain Unspecified; no synopsis stored.');
}
