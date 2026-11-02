import registry from './illustrationRegistry.json' with {type:'json'};
import {resolveIllustration} from './illustrationRegistry.mjs';
export const ILLUSTRATIONS=Object.freeze(Object.fromEntries(Object.entries(registry).map(([id,row])=>[id,Object.freeze(row)])));
export const illustrationLabelKey=value=>String(value||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en-US');
export function illustrationFor(trope){const art=resolveIllustration(trope);return art&&ILLUSTRATIONS[art.id]?.status==='ready'?ILLUSTRATIONS[art.id]:null;}
export function tropeArtDataUri(trope){const row=illustrationFor(trope);return row?(import.meta.env?.BASE_URL||'/')+row.src:null;}
