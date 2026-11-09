import React,{useState} from 'react';
import './free-emblem.css';
import {resolveIllustration} from './engine/illustrationRegistry.mjs';

const reported=new Set();
function reportMissing(issue){
 if(import.meta.env.DEV&&!reported.has(issue.id)){
  reported.add(issue.id);console.error('[illustration-registry]',issue);
 }
}
export default function TropeIllustration({trope}){
 const [failed,setFailed]=useState(null);
 const [detailFailed,setDetailFailed]=useState(null);
 const art=resolveIllustration(trope,{base:import.meta.env.BASE_URL,onMissing:reportMissing});
 if(!art||failed===art.src)return <span className="square-art-missing" data-missing-illustration={trope?.id} role="img" aria-label={'Illustration unavailable for '+trope?.label}>Illustration unavailable</span>;
 const detail=art.detailSrc&&detailFailed!==art.detailSrc;
 return <img key={`${art.src}:${detail?'detail':'standard'}`} className="square-art" data-illustration-id={art.id} src={art.src} srcSet={detail?`${art.src} 1x, ${art.detailSrc} 2x`:undefined} width="384" height="384" alt="" aria-hidden="true" decoding="async" onError={()=>{
  if(detail){setDetailFailed(art.detailSrc);return}
  reportMissing({id:trope.id,reason:'broken-image',src:art.src});setFailed(art.src);
 }}/>;
}
