// Wikimedia's public SPARQL service. Candidate discovery only; no auto-publication.
// Use original release years, not later regional releases or rebroadcasts.
// Respect query budgets, 429/Retry-After, and Wikimedia User-Agent policy.
const ENDPOINT='https://query.wikidata.org/sparql';
export const QUERY=`SELECT ?item ?itemLabel ?date ?networkLabel ?productionCompanyLabel WHERE {
  {
    SELECT ?item (MIN(?released) AS ?date)
      (SAMPLE(?networkName) AS ?networkLabel)
      (SAMPLE(?companyName) AS ?productionCompanyLabel) WHERE {
      ?item wdt:P577 ?released.
      {
        # Only a film's *original* broadcaster, not a later rerun channel.
        VALUES ?networkName {
          "Hallmark Channel"@en "Hallmark Movies & Mysteries"@en
          "Hallmark Movies and Mysteries"@en "Hallmark Mystery"@en
          "Hallmark Family"@en "Lifetime"@en
          "Lifetime Movie Network"@en "LMN"@en
        }
        ?item wdt:P31/wdt:P279* wd:Q11424;
              wdt:P449 ?network.
        ?network rdfs:label ?networkName.
      } UNION {
        # MarVista/Reel One also distribute theatrical films. Only explicitly
        # made-for-TV films qualify for the Romantiverse catalog.
        VALUES ?companyName {
          "MarVista Entertainment"@en "Reel One Entertainment"@en
        }
        ?item wdt:P31/wdt:P279* wd:Q506240;
              wdt:P272 ?company.
        ?company rdfs:label ?companyName.
      }
    } GROUP BY ?item
  }
  FILTER(?date >= "2000-01-01T00:00:00Z"^^xsd:dateTime)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} ORDER BY DESC(?date) LIMIT 500`;
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
 }
 return [...byId.values()];
}
export async function discoverWikidata({fetcher=fetch,userAgent='RomantiverseBingoCatalog/1.0 (https://github.com/Moldavite333/Romantiverse-Bingo-App)'}={}){
 const url=ENDPOINT+'?format=json&query='+encodeURIComponent(QUERY);
 const res=await fetcher(url,{headers:{Accept:'application/sparql-results+json','User-Agent':userAgent},signal:AbortSignal.timeout(20000)});
 if(!res.ok)throw Error('Wikidata returned '+res.status+'; retry later, do not hammer the endpoint');
 return normalizeWikidataResults(await res.json());
}
