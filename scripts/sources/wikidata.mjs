// Wikimedia's public SPARQL service. Candidate discovery only; no auto-publication.
// Use original release years, not later regional releases or rebroadcasts.
// Respect query budgets, 429/Retry-After, and Wikimedia User-Agent policy.
const ENDPOINT='https://query.wikidata.org/sparql';
const names={
 network:['Hallmark Channel','Hallmark Movies & Mysteries','Hallmark Movies and Mysteries','Hallmark Mystery',
  'Hallmark Family','Lifetime','Lifetime Movie Network','LMN'],
 company:['MarVista Entertainment','Reel One Entertainment']
};
const properties={network:'P449',company:'P272'};
const MAX_PROVIDERS=16, MAX_TITLES=500;
export const PROVIDER_QUERY=`SELECT DISTINCT ?provider ?name ?kind WHERE {
 ${Object.entries(names).map(([kind,labels])=>`{
  VALUES ?name { ${labels.map(label=>JSON.stringify(label)+'@en').join(' ')} }
  ?provider rdfs:label ?name.
  FILTER EXISTS { ?item wdt:${properties[kind]} ?provider. }
  BIND("${kind}" AS ?kind)
 }`).join(' UNION ')}
} LIMIT ${MAX_PROVIDERS+1}`;

export function providerQuery(id,kind){
 if(!/^Q\d+$/.test(id)||!Object.hasOwn(properties,kind))throw Error('Invalid Wikidata provider');
 const type=kind==='network'?'Q11424':'Q506240';
 return `SELECT ?item ?itemLabel ?date WHERE {
  {
   SELECT ?item (MIN(?released) AS ?date) WHERE {
    ?item wdt:${properties[kind]} wd:${id}; wdt:P577 ?released.
    FILTER EXISTS { ?item wdt:P31/wdt:P279* wd:${type}. }
   } GROUP BY ?item
   HAVING(MIN(?released) >= "2000-01-01T00:00:00Z"^^xsd:dateTime)
   ORDER BY DESC(?date) ?item LIMIT ${MAX_TITLES}
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
 } ORDER BY DESC(?date) ?item`;
}
// Query is intentionally narrow; metadata completeness and film coverage are not guaranteed.
export function normalizeWikidataResults(data){
 if(!Array.isArray(data?.results?.bindings))throw Error('Unexpected Wikidata SPARQL response');
 // A film may have multiple territory releases or re-air dates. Preserve its
 // earliest known release year, not a later broadcast of the same Wikidata item.
 const byId=new Map();
 for(const b of data.results.bindings){
  const url=b.item?.value||'';
 const id=/\/entity\/(Q\d+)$/.exec(url)?.[1];
  const title=b.itemLabel?.value?.trim();
  if(!id||!title)continue;
  const candidate={source:'wikidata',source_id:id,source_url:url,title,
   release_year:b.date?.value?Number(b.date.value.slice(0,4)):null,
   network:b.networkLabel?.value||null,
   production_company:b.productionCompanyLabel?.value||null,
   tv_film_evidence:b.tvFilmEvidence?.value==='television film',
   synopsis:'', // Wikidata descriptions are not plot synopses.
   short_description:b.itemDescription?.value||'',
   editorial_status:'review_required',suitable_for_auto_import:false,
   attribution:'Wikidata contributors (CC0); check downstream source rights for any linked content'};
  const prior=byId.get(id);
  if(!prior){byId.set(id,candidate);continue;}
  // Preserve source evidence from multiple bindings while retaining the
  // earliest release date. A later rebroadcast must not erase producer data.
  if(Number.isInteger(candidate.release_year)&&
     (!Number.isInteger(prior.release_year)||candidate.release_year<prior.release_year))
    prior.release_year=candidate.release_year;
  if(!prior.network&&candidate.network)prior.network=candidate.network;
  if(!prior.production_company&&candidate.production_company)
    prior.production_company=candidate.production_company;
  prior.tv_film_evidence=prior.tv_film_evidence||candidate.tv_film_evidence;
 }
 return [...byId.values()];
}
// Wikidata occasionally rate-limits or temporarily fails during the weekly job.
// Honor Retry-After, but never spin, retry indefinitely, or hold a runner for
// minutes. A long cooldown is a signal to defer until the next scheduled run.
const RETRYABLE_STATUS=new Set([429,502,503,504]);
const MAX_RETRY_WAIT_MS=12000;
function retryDelayMs(response,now){
 const raw=response.headers?.get?.('Retry-After')?.trim();
 if(!raw)return 1500;
 if(/^\d+(?:\.\d+)?$/.test(raw))return Number(raw)*1000;
 const timestamp=Date.parse(raw);
 return Number.isFinite(timestamp)?Math.max(0,timestamp-now):1500;
}
async function requestWikidata(query,{fetcher,userAgent,sleep,now,budget}){
 const url=ENDPOINT+'?format=json&query='+encodeURIComponent(query);
 for(let attempt=0;attempt<2;attempt++){
  let res;
  try{
   // The public query service can be slow. A timeout is transient, not a reason
   // to abandon this week's catalog update without one bounded retry.
   res=await fetcher(url,{headers:{Accept:'application/sparql-results+json','User-Agent':userAgent},signal:AbortSignal.timeout(attempt===0?25000:35000)});
  }catch(error){
   if(attempt===1||!budget.retries)throw new Error('Wikidata could not be reached after bounded attempts; catalog left unchanged',{cause:error});
   budget.retries--;
   await sleep(1500);
   continue;
  }
  if(res.ok){
   const bindings=(await res.json())?.results?.bindings;
   if(!Array.isArray(bindings))throw Error('Unexpected Wikidata SPARQL response');
   return bindings;
  }
  if(attempt===1||!budget.retries||!RETRYABLE_STATUS.has(res.status))
   throw Error('Wikidata returned '+res.status+'; retry later, do not hammer the endpoint');
  const wait=retryDelayMs(res,now());
  if(!Number.isFinite(wait)||wait>MAX_RETRY_WAIT_MS)
   throw Error('Wikidata returned '+res.status+'; Retry-After exceeds bounded retry window');
  budget.retries--;
  await sleep(Math.max(0,wait));
 }
 throw Error('Wikidata retry exhausted');
}

export async function discoverWikidata({
 fetcher=fetch,
 userAgent='RomantiverseBingoCatalog/1.0 (https://github.com/Moldavite333/Romantiverse-Bingo-App)',
 sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),
 now=()=>Date.now()
}={}){
 const options={fetcher,userAgent,sleep,now,budget:{retries:1}};
 const index=await requestWikidata(PROVIDER_QUERY,options);
 if(!index.length||index.length>MAX_PROVIDERS)throw Error('Wikidata provider index is empty or exceeds its request budget');
 const bindings=[],releaseDates=new Map();
 for(const row of index){
  const id=/\/entity\/(Q\d+)$/.exec(row.provider?.value||'')?.[1],kind=row.kind?.value,label=row.name?.value;
  if(!id||!Object.hasOwn(names,kind)||!names[kind].includes(label))throw Error('Unexpected Wikidata provider index entry');
  const films=await requestWikidata(providerQuery(id,kind),options);
  for(const film of films){
   const item=film.item?.value,date=film.date?.value;
   if(date&&(!releaseDates.has(item)||date<releaseDates.get(item)))releaseDates.set(item,date);
   bindings.push({...film,...(kind==='network'?{networkLabel:{value:label}}:{
    productionCompanyLabel:{value:label},tvFilmEvidence:{value:'television film'}
   })});
  }
 }
 return normalizeWikidataResults({results:{bindings}}).sort((a,b)=>{
  const date=id=>releaseDates.get('http://www.wikidata.org/entity/'+id)||releaseDates.get('https://www.wikidata.org/entity/'+id)||'';
  return date(b.source_id).localeCompare(date(a.source_id))||a.source_id.localeCompare(b.source_id);
 }).slice(0,MAX_TITLES);
}
