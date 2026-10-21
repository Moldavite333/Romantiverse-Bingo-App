// Compile approved metadata and predicted tropes into static data; no paid AI.
import fs from 'node:fs';
import {analyzeMovie} from '../src/engine/intelligence.mjs';
const path='public/catalog/movies.json';
const body=JSON.parse(fs.readFileSync(path,'utf8'));
const output={version:1,source_catalog_version:body.version,movies:body.movies.map(m=>{
 const result=analyzeMovie(m);
 return {id:m.id,title:m.title,season:m.season,
  cheese:result.cheese.slice(0,16).map(({id,label,confidence,evidence,reason})=>({id,label,confidence,evidence,reason})),
  seasonal:result.seasonal.slice(0,16).map(({id,label,confidence,evidence,reason})=>({id,label,confidence,evidence,reason})),
  scene_verified:false};
})};
fs.writeFileSync('public/catalog/trope-suggestions.json',JSON.stringify(output,null,2)+'\n');
console.log('Compiled predictions for '+output.movies.length+' movies; no AI calls.');
