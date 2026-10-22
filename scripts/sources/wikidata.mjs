// Wikimedia's public SPARQL service. Candidate discovery only; no auto-publication.
// Respect query budgets, 429/Retry-After, and Wikimedia User-Agent policy.
const ENDPOINT='https://query.wikidata.org/sparql';
export const QUERY=`SELECT DISTINCT ?item ?itemLabel ?date ?networkLabel WHERE {
  VALUES ?networkLabel { "Hallmark Channel"@en "Hallmark Movies & Mysteries"@en "Hallmark Movies and Mysteries"@en "Hallmark Mystery"@en "Hallmark Family"@en }
  ?item wdt:P31/wdt:P279* wd:Q11424;
        wdt:P577 ?date;
        wdt:P449 ?network.
  ?network rdfs:label ?networkLabel.
  FILTER(?date >= "2020-01-01T00:00:00Z"^^xsd:dateTime)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} ORDER BY DESC(?date) LIMIT 500`;
// Query is intentionally narrow; metadata completeness and film coverage are not guaranteed.
export function normalizeWikidataResults(data){
 if(!Array.isArray(data?.results?.bindings))throw Error('Unexpected Wikidata SPARQL response');
 return data.results.bindings.map(b=>{
 const url=b.item?.value||'';
 const id=/\/entity\/(Q\d+)$/.exec(url)?.[1];
 const title=b.itemLabel?.value?.trim();
 if(!id||!title)return null;
 return {source:'wikidata',source_id:id,source_url:url,title,
  release_year:b.date?.value?Number(b.date.value.slice(0,4)):null,
  network:b.networkLabel?.value||null,
  synopsis:'', // Wikidata descriptions are not plot synopses.
  short_description:b.itemDescription?.value||'',
  editorial_status:'review_required',suitable_for_auto_import:false,
  attribution:'Wikidata contributors (CC0); check downstream source rights for any linked content'};
 }).filter(Boolean);
}
export async function discoverWikidata({fetcher=fetch,userAgent='RomantiverseBingoCatalog/1.0 (https://github.com/Moldavite333/Romantiverse-Bingo-App)'}={}){
 const url=ENDPOINT+'?format=json&query='+encodeURIComponent(QUERY);
 const res=await fetcher(url,{headers:{Accept:'application/sparql-results+json','User-Agent':userAgent},signal:AbortSignal.timeout(20000)});
 if(!res.ok)throw Error('Wikidata returned '+res.status+'; retry later, do not hammer the endpoint');
 return normalizeWikidataResults(await res.json());
}
