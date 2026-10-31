import test from 'node:test';import assert from 'node:assert/strict';
import {isHallmarkNetwork,isEligibleNetwork,isEligibleTvProducer,seasonalThemeFromTitle,prepareOpenDataMovie,mergeVerifiedNetworkMetadata,mergeSourceQualifiedMetadata} from '../scripts/auto-update-catalog.mjs';
const movie={source:'wikidata',source_id:'Q12345',source_url:'https://www.wikidata.org/wiki/Q12345',title:'Christmas in the Valley',release_year:2026,network:'Hallmark Channel',synopsis:'Do not retain this source prose'};
test('only explicitly identified Hallmark networks qualify',()=>{
 assert.equal(isHallmarkNetwork('Hallmark Channel'),true);
 assert.equal(isHallmarkNetwork('Hallmark Mystery'),true);
 assert.equal(isHallmarkNetwork('Hallmark-ish Streaming'),false);
 assert.equal(prepareOpenDataMovie({...movie,network:null}),null);
});
test('does not retain synopsis and does not duplicate title/year',()=>{
 const m=prepareOpenDataMovie(movie);assert.ok(m);assert.ok(!JSON.stringify(m).includes('Do not retain'));
 assert.equal(m.id,'wikidata-q12345');
 assert.match(m.id,/^[a-z0-9][a-z0-9-]{0,119}$/);
 const base={version:1,movies:[]};
 const once=mergeVerifiedNetworkMetadata(base,[movie,movie]);
 assert.equal(once.added,1);assert.equal(once.catalog.movies.length,1);
 assert.equal(mergeVerifiedNetworkMetadata(once.catalog,[movie]).added,0);
});

test('seasonal classification never defaults an unknown movie to Christmas',()=>{
 assert.equal(seasonalThemeFromTitle('Christmas in the Valley'),'Christmas');
 assert.equal(seasonalThemeFromTitle('The Autumn Promise'),'Fall');
 assert.equal(seasonalThemeFromTitle('Pumpkin Pie Wars'),'Fall');
 assert.equal(seasonalThemeFromTitle('A Winter Wedding'),null);
 assert.equal(seasonalThemeFromTitle('A Holiday Abroad'),null);
 assert.equal(seasonalThemeFromTitle('Love at First Sight'),null);
 assert.equal(seasonalThemeFromTitle('Fall for You'),null);
 assert.equal(seasonalThemeFromTitle('Christmas Harvest'),null);
});
test('scheduled import keeps network-qualified unknown-season titles without fabricating a season',()=>{
 const unclassified={...movie,source_id:'Q12346',title:'A Winter Wedding'};
 const unknown=prepareOpenDataMovie(unclassified);
 assert.equal(unknown.season,'Unspecified');
 assert.equal(unknown.verification_status,'unverified');
 assert.equal(unknown.facts_status,'title_only_unverified');
 assert.ok(!JSON.stringify(unknown).includes('Do not retain'));
 const fall={...movie,source_id:'Q12347',title:'Autumn in the Valley'};
 assert.equal(prepareOpenDataMovie(fall).season,'Fall');
 const result=mergeVerifiedNetworkMetadata({version:1,movies:[]},[unclassified,fall,movie]);
 assert.equal(result.added,3);
 assert.deepEqual(result.catalog.movies.map(m=>m.season).sort(),['Christmas','Fall','Unspecified']);
 assert.equal(mergeVerifiedNetworkMetadata(result.catalog,[unclassified]).added,0);
});

test('Lifetime original broadcasts qualify without inventing film plot or season',()=>{
 assert.equal(isEligibleNetwork('Lifetime'),true);
 assert.equal(isEligibleNetwork('Lifetime Movie Network'),true);
 assert.equal(isEligibleNetwork('LMN'),true);
 assert.equal(isEligibleNetwork('Lifetime Television Fan Page'),false);
 const lifetime={...movie,source_id:'Q22222',title:'The Winter Reunion',network:'Lifetime'};
 const result=prepareOpenDataMovie(lifetime);
 assert.equal(result.network,'Lifetime');
 assert.equal(result.season,'Unspecified');
 assert.equal(result.verification_status,'unverified');
 assert.ok(!('production_company' in result));
 assert.ok(!JSON.stringify(result).includes('Do not retain'));
});
test('MarVista and Reel One require explicit made-for-TV Wikidata evidence',()=>{
 for(const [id,company] of [['Q33333','MarVista Entertainment'],['Q44444','Reel One Entertainment']]){
  assert.equal(isEligibleTvProducer(company),true);
  const candidate={...movie,source_id:id,title:'A New Beginning',network:null,
    production_company:company,tv_film_evidence:true};
  const imported=prepareOpenDataMovie(candidate);
  assert.equal(imported.production_company,company);
  assert.ok(!('network' in imported),'Do not pretend the production company is a broadcast network');
  assert.equal(prepareOpenDataMovie({...candidate,tv_film_evidence:false}),null);
  assert.equal(prepareOpenDataMovie({...candidate,tv_film_evidence:undefined}),null);
 }
 assert.equal(isEligibleTvProducer('MarVista Distribution'),false);
 assert.equal(prepareOpenDataMovie({...movie,source_id:'Q55555',network:null,
   production_company:'MarVista Distribution',tv_film_evidence:true}),null);
});
test('source-qualified imports preserve IDs and reject unlabeled Wikidata items',()=>{
 const company={...movie,source_id:'Q55555',title:'A New Beginning',network:null,
   production_company:'MarVista Entertainment',tv_film_evidence:true};
 const lifetime={...movie,source_id:'Q66666',title:'A Different Beginning',network:'Lifetime'};
 const merged=mergeSourceQualifiedMetadata({version:1,movies:[]},[company,lifetime]);
 assert.equal(merged.added,2);
 assert.deepEqual(merged.catalog.movies.map(m=>m.id).sort(),['wikidata-q55555','wikidata-q66666']);
 assert.equal(mergeSourceQualifiedMetadata(merged.catalog,[company,lifetime]).added,0);
 assert.equal(prepareOpenDataMovie({...lifetime,title:'Q66666'}),null);
});

test('weekly refresh enriches existing titles with verified producer metadata without changing identity or editorial facts',()=>{
 const existing={id:'editorial-a-christmas-village-2018',title:'A Christmas Village',
  release_year:2018,season:'Christmas',is_demo:false,verification_status:'metadata_verified',
  poster_url:'https://image.tmdb.org/t/p/w500/example.jpg',
  story_facts:{setting:[],relationship:[],conflict:[],event:[]}};
 const candidate={...movie,source_id:'Q98765',title:existing.title,release_year:2018,
  network:null,production_company:'Reel One Entertainment',tv_film_evidence:true};
 const once=mergeSourceQualifiedMetadata({version:1,movies:[existing]},[candidate]);
 assert.equal(once.added,0);
 assert.equal(once.enriched,1);
 assert.equal(once.catalog.movies.length,1);
 assert.deepEqual(once.catalog.movies[0],{...existing,production_company:'Reel One Entertainment'});
 const again=mergeSourceQualifiedMetadata(once.catalog,[candidate]);
 assert.equal(again.added,0);
 assert.equal(again.enriched,0);
});
test('catalog enrichment does not overwrite editorial labels or attach evidence to a different film',()=>{
 const existing={id:'editorial-film',title:'Winter Wishes',release_year:2024,
  network:'Hallmark Channel',production_company:'Original Studio',is_demo:false};
 const conflicting={...movie,source_id:'Q99990',title:'Winter Wishes',release_year:2024,
  network:'Lifetime',production_company:'Reel One Entertainment',tv_film_evidence:true};
 const collision={...movie,source_id:'Q99991',title:'Another Film',release_year:2025,
  network:'Lifetime'};
 const result=mergeSourceQualifiedMetadata({version:1,movies:[existing]},[conflicting]);
 assert.equal(result.enriched,0);
 assert.deepEqual(result.catalog.movies[0],existing);
 const collisionResult=mergeSourceQualifiedMetadata({version:1,movies:[
  {...existing,id:'wikidata-q99991'}
 ]},[collision]);
 assert.equal(collisionResult.added,0);
 assert.equal(collisionResult.enriched,0);
 assert.equal(collisionResult.catalog.movies[0].title,'Winter Wishes');
});
