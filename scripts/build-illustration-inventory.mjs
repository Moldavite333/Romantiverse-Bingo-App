import {writeFileSync,mkdirSync} from 'node:fs';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
import {CHEESE,SEASONAL} from '../src/engine/intelligence.mjs';
import {storyScenes,christmasScenes,fallScenes,horrorScenes} from './illustration-scenes.mjs';
import {equivalents,extraScenes} from './room-illustration-scenes.mjs';
const make=(t,scene,active=true)=>({id:t.id,label:t.label,active,asset:scene?`illustrations/${t.id}.webp`:null,scene:scene||null,reviewed:false});
const entries=[...CHEESE.map((t,i)=>make(t,storyScenes[i])),...Object.entries(SEASONAL).flatMap(([theme,labels])=>labels.map((label,i)=>make({id:`season-${theme}-${i}`,label},({Christmas:christmasScenes,Fall:fallScenes,Horror:horrorScenes}[theme]||[])[i],theme!=='Horror'))),make({id:'free',label:'CHEESE LOUISE POD'},'Original scarf-wearing cheese mascot hosting a vintage microphone; exact brand text CHEESE LOUISE POD; never a wreath.')];
if(entries.some(t=>t.active&&!t.scene))throw Error('Missing active scene brief');
const room=readFileSync('supabase/functions/game-room/index.ts','utf8');
const literal=re=>vm.runInNewContext('('+room.match(re)[1]+')',Object.create(null),{timeout:1000});
const cheese=literal(/const cheese=(\[[^\n]*\]);/),themes=literal(/const themes=(\{[^\n]*\});/);
const aliases={};
for(const label of [...cheese,...['Romance','Christmas','Fall'].flatMap(t=>themes[t])]){
 const same=entries.find(e=>e.label===label);
 const id=equivalents[label]||same?.id||'room-'+label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 if(!entries.some(e=>e.id===id))entries.push(make({id,label},extraScenes[label]));
 if(!entries.find(e=>e.id===id)?.scene)throw Error('Missing multiplayer scene: '+label);
 aliases[label]=id;
}
const archiveScenes=[
 'A frightened caretaker urgently holds back a visitor from entering a foggy graveyard while pointing toward a crumbling gateway.',
 'A visitor recoils as an antique porcelain doll on an attic chair seems to turn its head toward them, candle trembling in their hand.',
 'Two cautious explorers lift a lantern at the gate of an abandoned house, one stepping toward the porch and the other hesitating.'
];
for(const [i,label] of themes.Horror.entries()){
 const id=i<25?`season-Horror-${i}`:'archive-room-'+label.toLowerCase().replace(/[^a-z0-9]+/g,'-');
 if(i>=25)entries.push(make({id,label},archiveScenes[i-25],false));
 aliases[label]=id;
}
mkdirSync('src/art',{recursive:true});
const previous=existsSync('src/art/illustrations.json')?JSON.parse(readFileSync('src/art/illustrations.json','utf8')):[];
for(const e of entries){
 const old=previous.find(p=>p.id===e.id&&p.label===e.label&&p.scene===e.scene&&p.asset===e.asset);
 if(old)for(const key of ['sourceSha256','assetSha256','generated','reviewed'])if(key in old)e[key]=old[key];
}
writeFileSync('src/art/illustrations.json',JSON.stringify(entries,null,2)+'\n');
writeFileSync('src/art/room-illustration-aliases.json',JSON.stringify(aliases,null,2)+'\n');
console.log(`${entries.filter(t=>t.active&&t.id!=='free').length} active tropes; ${entries.filter(t=>!t.active).length} archived; dedicated branded center.`);
