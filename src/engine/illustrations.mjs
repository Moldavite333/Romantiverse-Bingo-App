import registry from './illustrationRegistry.json' with {type:'json'};
import roomAliases from './roomIllustrationAliases.json' with {type:'json'};
const legacyLabels=new Map(Object.entries(roomAliases).map(([label,id])=>[label.normalize('NFKC').toLowerCase(),id]));
export const ILLUSTRATIONS = Object.freeze(Object.fromEntries(Object.entries(registry).map(([id,row])=>[id,Object.freeze(row)])));
export const illustrationLabelKey = value => String(value||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en-US');
// IDs belong to the gameplay engine. Labels guard against stale positional season IDs.
// Never derive artwork from categories, keywords, seeds, or supplied image URLs.
export function illustrationFor(trope){
 const legacy=/^(?:cheese|seasonal)-\d+$/.test(trope?.id||'')||String(trope?.id||'').startsWith('cl-');
 const id=trope?.id==='free'||trope?.category==='free'?'free':legacy?legacyLabels.get(illustrationLabelKey(trope?.label)):trope?.id;
 const row=ILLUSTRATIONS[id];
 if(!row||row.status!=='ready')return null;
 if(id!=='free'&&!legacy&&illustrationLabelKey(trope?.label)!==illustrationLabelKey(row.label))return null;
 return row;
}
export function tropeArtDataUri(trope){
 const row=illustrationFor(trope);
 return row?(import.meta.env?.BASE_URL||'/')+row.src:null;
}
