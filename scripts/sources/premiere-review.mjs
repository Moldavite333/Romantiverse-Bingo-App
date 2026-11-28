import {matchMovie,normalizeTitle} from './hallmark-discovery.mjs';

export function buildPremiereReview(listings,catalog,{from,days=31}={}){
 const start=Date.parse(from||listings.checked_on);
 if(!Number.isFinite(start)||!Number.isInteger(days)||days<1||days>90)throw Error('Invalid premiere review window');
 const end=start+days*86400000;
 const rows=[],seen=new Set();
 for(const row of listings.premieres){
  const at=Date.parse(row.at),source=listings.sources[row.source];
  if(!normalizeTitle(row.title)||!Number.isFinite(at)||!/(Z|[+-]\d{2}:\d{2})$/.test(row.at)||!source?.url?.startsWith('https://')){
   throw Error('Invalid premiere evidence for '+row.title);
  }
  const year=Number(row.at.slice(0,4)),key=normalizeTitle(row.title)+'|'+year;
  if(seen.has(key))throw Error('Duplicate premiere identity '+key);
  seen.add(key);
  if(at<start||at>=end)continue;
  const identity=matchMovie({title:row.title,year},catalog.movies);
  const nextDay=new Date(Date.parse(row.at.slice(0,10))+86400000).toISOString().slice(0,10);
  rows.push({title:row.title,year,premiere_at:row.at,network:source.network,principal_cast:row.cast,
   market:listings.market,source_url:source.url,checked_on:listings.checked_on,
   next_day_availability:source.next_day_provider?{provider:source.next_day_provider,access:source.access,date:nextDay}:null,
   catalog_status:identity.status,catalog_matches:identity.matches});
 }
 return {source_checked_on:listings.checked_on,rows:rows.sort((a,b)=>Date.parse(a.premiere_at)-Date.parse(b.premiere_at)||a.title.localeCompare(b.title))};
}
