import React,{useState} from 'react';
import {resolveIllustration} from './engine/illustrationRegistry.mjs';

const reported=new Set();
function reportMissing(issue){
 if(import.meta.env.DEV&&!reported.has(issue.id)){
  reported.add(issue.id);console.error('[illustration-registry]',issue);
 }
}
export default function TropeIllustration({trope}){
 const [failed,setFailed]=useState(null);
 const art=resolveIllustration(trope,{base:import.meta.env.BASE_URL,onMissing:reportMissing});
 if(!art||failed===art.src)return <span className="square-art-missing" data-missing-illustration={trope?.id} aria-hidden="true">Illustration pending</span>;
 return <img className="square-art" src={art.src} width="100" height="100" alt="" aria-hidden="true" decoding="async" onError={()=>{reportMissing({id:trope.id,reason:'broken-image',src:art.src});setFailed(art.src)}}/>;
}
