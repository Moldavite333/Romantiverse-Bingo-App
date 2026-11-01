import React,{useState} from 'react';
import {tropeArtDataUri} from './engine/tropeArt.mjs';
export default function TropeIllustration({trope}){
 const src=tropeArtDataUri(trope),[broken,setBroken]=useState(null);
 if(!src||broken===src)return <span className="square-art-missing" data-missing-illustration={trope?.id||'unknown'} role="img" aria-label={'Illustration unavailable for '+trope?.label}>Illustration unavailable</span>;
 return <img className="square-art" data-illustration-id={trope.id} src={src} alt="" aria-hidden="true" decoding="async" width="384" height="384" onError={()=>setBroken(src)}/>;
}
