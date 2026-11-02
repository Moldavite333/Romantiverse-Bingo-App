import React from 'react';
import {resolveIllustration} from './engine/illustrationRegistry.mjs';

// Decorative editorial artwork. Trope squares keep their own strict renderer.
export default function StoryArtwork({id,className='',loading='lazy'}){
 const art=resolveIllustration({id},{base:import.meta.env.BASE_URL});
 return art?<img className={className} src={art.src} width="384" height="384" alt="" aria-hidden="true" loading={loading} decoding="async"/>:null;
}
