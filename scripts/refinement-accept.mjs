// Run only after visually inspecting each generated source and optimized asset.
import {readFile,writeFile} from 'node:fs/promises';
const edits=JSON.parse(await readFile(process.argv[2],'utf8'));
const entries=JSON.parse(await readFile('src/art/illustrations.json','utf8'));
const registry=JSON.parse(await readFile('src/engine/illustrationRegistry.json','utf8'));
for(const {id} of edits){const e=entries.find(e=>e.id===id);if(!e||e.id==='free'||!e.active)throw Error('Invalid refinement target');e.reviewed=true;registry[id].status='ready'}
await writeFile('src/art/illustrations.json',JSON.stringify(entries,null,2)+'\n');
await writeFile('src/engine/illustrationRegistry.json',JSON.stringify(registry,null,2)+'\n');
