// Weekly offline audit: source links, known catalog, and quality notes.
// No third-party site is fetched or scraped; no movie is auto-published.
import fs from 'node:fs';
import {HALLMARK_FEEDS,LISTING_SOURCES,candidateQuality} from './sources/hallmark-discovery.mjs';
const body=JSON.parse(fs.readFileSync('public/catalog/movies.json','utf8'));
const report={
 generated_at:new Date().toISOString(),movie_count:body.movies.length,
 goal:'Discover Hallmark movies and permitted synopses through editorial review',
 sources:[...LISTING_SOURCES,...HALLMARK_FEEDS],
 existing_movies:body.movies.map(m=>({id:m.id,title:m.title,year:m.release_year,season:m.season,verification_status:m.verification_status,quality:candidateQuality({title:m.title,year:m.release_year,network:m.network,source_url:m.source_url,synopsis:m.synopsis})})),
 next_steps:['Review upcoming premieres and the two-week schedule','Confirm exact title, year and Hallmark affiliation from independent sources','Find authorized or editorially original synopsis','Record source URL and reuse permission','Merge approved records; validate and compile card predictions'],
 publication:'Never publish unreviewed source material or third-party synopses'
};
fs.mkdirSync('research',{recursive:true});
fs.writeFileSync('research/hallmark-weekly-review.json',JSON.stringify(report,null,2)+'\n');
console.log('Built Hallmark weekly editorial review for '+body.movies.length+' existing movies.');
