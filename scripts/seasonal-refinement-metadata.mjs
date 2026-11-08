import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='artifacts/spring-summer-refinement';
const generation=JSON.parse(await readFile(root+'/generation-ledger.json','utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const accepted=[];
for(const e of generation.accepted){
 const source=`${root}/sources/stage-${e.stage}/${e.id}.png`;
 const bytes=await readFile(source);
 accepted.push({id:e.id,stage:e.stage,asset:`public/illustrations/${e.id}.webp`,source,sourceSha256:hash(bytes),promptTrail:e.prompt.split('\nCORRECTION: ')});
}
const rejected=[];await mkdir(root+'/rejected',{recursive:true});
for(const e of generation.rejected){
 const file=`${root}/rejected/stage-${e.stage}-${e.id}.png`;await copyFile(e.source,file);
 rejected.push({id:e.id,stage:e.stage,source:file,sourceSha256:hash(await readFile(file)),reason:e.reason,prompt:e.prompt});
}
await writeFile('docs/artwork/spring-summer-refinement-prompts.json',JSON.stringify({date:'2026-11-08',generator:'built-in image_gen',invocations:11,acceptedEdits:8,distinctScenes:7,rejectedDrafts:3,accepted,rejected},null,2)+'\n');
const scenes={
 'season-Spring-20':'A woman holds the empty nursery pot with both hands while an older man grips a grounded shovel beside a newly planted cherry tree; affectionate eye contact and clearly separate arm paths.',
 'season-Spring-17':'Two adult florists exchange playful competitive glances over separate spring arrangements while an older judge holds a plain coral award rosette between them; no written sign.',
 'season-Summer-19':'Two travelers with luggage react with rueful amusement as a clearly visible passenger ferry pulls away across an open gap of summer harbor water.',
 'season-Summer-20':'Two apron-clad rivals present separate tomato-and-basil salad bowls at a summer market while an older vendor tastes a sample as judge; separated hands and expressive competitive faces.',
 'season-Summer-22':'Two summer cafe colleagues pause while setting tables; the man offers a palm-sized posy of three daisies instead of cutlery while the woman smiles shyly with a towel and utensils in hand.'
};
const entries=JSON.parse(await readFile('src/art/illustrations.json','utf8')),briefs=JSON.parse(await readFile('docs/artwork/scene-briefs.json','utf8'));
for(const e of entries)if(scenes[e.id])e.scene=scenes[e.id];
for(const b of briefs){if(scenes[b.id])b.brief=scenes[b.id];const trail=accepted.filter(e=>e.id===b.id);if(trail.length)b.refinements=trail.map(e=>({stage:e.stage,prompts:e.promptTrail,source:e.source}))}
await writeFile('src/art/illustrations.json',JSON.stringify(entries,null,2)+'\n');
await writeFile('docs/artwork/scene-briefs.json',JSON.stringify(briefs,null,2)+'\n');
console.log('Captured eight accepted raster edits, seven distinct scenes and three rejected drafts.');
