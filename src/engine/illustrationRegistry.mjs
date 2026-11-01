import entries from '../art/illustrations.json' with {type:'json'};
import roomAliases from '../art/room-illustration-aliases.json' with {type:'json'};

// IDs are engine IDs, not label hashes, array positions, categories or regexes.
export const illustrationRegistry=Object.freeze(Object.fromEntries(entries.map(e=>[e.id,Object.freeze(e)])));
export function resolveIllustration(trope,{base='/',onMissing=()=>{}}={}){
 const roomId='room-'+String(trope?.label||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 // Existing server cards used shuffled positional IDs. Exact approved label
 // migration is restricted to that legacy ID format and stable room IDs.
 const legacy=/^(?:cheese|seasonal)-\d+$/.test(String(trope?.id));
 const id=trope?.category==='free'?'free':(legacy||trope?.id===roomId)?roomAliases[trope?.label]:trope?.id;
 const entry=illustrationRegistry[id];
 if(!entry?.asset){onMissing({id:trope?.id,label:trope?.label,reason:entry?'unfinished':'unregistered'});return null;}
 return {id:entry.id,src:base.replace(/\/?$/,'/')+entry.asset,label:entry.label};
}
export function requireIllustration(trope,options){
 const art=resolveIllustration(trope,options);
 if(!art)throw Error(`Missing dedicated illustration for trope: ${String(trope?.id)}`);
 return art;
}
