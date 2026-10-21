// Synchronize only the public, code-defined concept rules from Cheese Louise.
// Never request Supabase, private workspace data, user votes or TMDB credentials.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const SOURCE='https://raw.githubusercontent.com/Moldavite333/Cheese-Louise/main/cheese-master.js';
const OUTPUT='src/engine/cheeseMasterConcepts.mjs';
export function extractConceptRules(source){
 if(typeof source!=='string'||source.length>250000)throw Error('Invalid upstream source size');
 const start=source.indexOf('const CM_CONCEPTS = {');
 const end=source.indexOf('\nfunction cmConceptSet',start);
 if(start<0||end<0||end<=start)throw Error('Cheese Master concept block missing or changed; refuse unsafe update');
 const block=source.slice(start,end).replace(/^const CM_CONCEPTS =/,'export const CM_CONCEPTS =');
 if(!block.includes('homecoming:')||!block.includes('old_flame:')||!block.includes('career:'))throw Error('Core Cheese Master concepts missing');
 if(/\b(?:eval|fetch|import|require|process|window|document|globalThis)\b/.test(block))throw Error('Unexpected executable dependency in concept rules');
 // Only declarative regular-expression literals, no function calls or dynamic execution.
 const lines=block.split('\n').slice(1,-1).filter(l=>l.trim()&&l.trim()!=='};');
 if(!lines.length||lines.some(l=>!/^\s*[a-z][a-z0-9_]*:\s*\/(?:\\.|[^\/])*\/[a-z]*,?\s*$/.test(l)))throw Error('Unexpected syntax in concept rules');
 return '// Automatically synchronized from Cheese Louise Cheese Master. Pure local rules only.\n'+block+
 '\nexport function recognizeCheeseConcepts(input){const text=String(input||\'\').toLowerCase().slice(0,12000);return Object.entries(CM_CONCEPTS).filter(([,re])=>re.test(text)).map(([key])=>key)}\n';
}
export async function syncCheeseMaster({fetcher=fetch,output=OUTPUT}={}){
 const response=await fetcher(SOURCE,{headers:{Accept:'text/plain'},signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('Cheese Master source unavailable: '+response.status);
 const content=extractConceptRules(await response.text());
 const previous=fs.existsSync(output)?fs.readFileSync(output,'utf8'):'';
 if(previous===content)return {changed:false,output};
 fs.writeFileSync(output,content);
 return {changed:true,output};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const result=await syncCheeseMaster();console.log(result.changed?'Updated Cheese Master concept rules':'Cheese Master already synchronized');
}
