import {factKeywords} from './storyFacts.mjs';
// Explainable, deterministic trope analysis. No network/AI model claims.
export const CHEESE=[
{id:'meet-cute',label:'First meeting',signals:['meet','runs into','bumps into','encounter'],weight:0.83},
{id:'career-vs-love',label:'Career versus love dilemma',signals:['career','promotion','job','executive','lawyer','business'],weight:0.78},
{id:'return-home',label:'Big-city person returns home',signals:['returns home','hometown','back home','small town'],weight:0.88},
{id:'old-flame',label:'An old flame reappears',signals:['old flame','childhood sweetheart','ex-boyfriend','ex-girlfriend','first love'],weight:0.85},
{id:'save-the-business',label:'A beloved business must be saved',signals:['save the','struggling','closure','family bakery','inn'],weight:0.79},
{id:'misunderstanding',label:'A misunderstanding',signals:['secret','misunderstanding','mistake'],weight:0.81},
{id:'interruption',label:'An interruption',signals:['surprise','unexpected'],weight:0.7},
{id:'grand-gesture',label:'A romantic gesture',signals:['love','romance','reconnects'],weight:0.68},
{id:'wise-relative',label:'A relative gives unsolicited love advice',signals:['family','mother','father','grandmother'],weight:0.7},
{id:'almost-kiss',label:'The almost-kiss',signals:['romance','love','flame'],weight:0.8},
{id:'townspeople',label:'The entire town gets involved',signals:['town','festival','community'],weight:0.78},
{id:'deadline',label:'A romantic deadline approaches',signals:['christmas eve','wedding','festival','deadline'],weight:0.78},
{id:'misplaced-priorities',label:'Someone learns the true meaning of life',signals:['career','work','business'],weight:0.76},
{id:'coincidence',label:'A coincidence',signals:['unexpected','surprise','chance'],weight:0.74},
{id:'rival',label:'An inconvenient romantic rival',signals:['ex','fiancé','rival'],weight:0.58},
{id:'decorating',label:'Decorating turns into accidental flirting',signals:['holiday','christmas','renovation'],weight:0.72},
{id:'awkward-date',label:'An awkward date',signals:['dating','romance','love'],weight:0.68},
{id:'forced-proximity',label:'Two people are forced to spend time together',signals:['snowstorm','stranded','work together','inherit'],weight:0.8},
{id:'town-event',label:'A town event saves the day',signals:['festival','fundraiser','parade','contest'],weight:0.79},
{id:'hidden-talent',label:'Someone reveals a secret talent',signals:['music','baking','singing','contest'],weight:0.64},
{id:'late-realization',label:'A romantic realization',signals:['love','reconnects'],weight:0.84},
{id:'last-minute-arrival',label:'Someone arrives at the last possible moment',signals:['deadline','christmas','wedding'],weight:0.77},
{id:'overheard',label:'Someone overhears the wrong half of a conversation',signals:['secret','misunderstanding'],weight:0.75},
{id:'family-pressure',label:'Family pressure complicates everything',signals:['family','parents','inherit'],weight:0.72},
{id:'big-city',label:'Big-city life loses its appeal',signals:['city','executive','career'],weight:0.78},
{id:'perfect-stranger',label:'A stranger knows exactly what to say',signals:['stranger','meets'],weight:0.63},
{id:'public-confession',label:'Love is confessed in public',signals:['festival','wedding','parade'],weight:0.69},
{id:'too-perfect',label:'The love interest has no apparent flaws',signals:['charming','perfect'],weight:0.68},
{id:'small-town-magic',label:'Small-town magic fixes a real-world problem',signals:['small town','hometown','community'],weight:0.79},
{id:'obvious-ending',label:'Everyone knows the ending except the leads',signals:['love','romance','flame'],weight:0.9},
{id:'family-heirloom',label:'A sentimental family heirloom matters',signals:['inherit','family','old'],weight:0.65},
{id:'stranded-in-town',label:'Breaking down / stuck in town',signals:['breakdown','car trouble','stranded','stuck in town','car breaks down'],weight:0.75},
{id:'family-tragedy',label:'Family tragedy',signals:['family tragedy','loss of a parent','family loss','grief','bereavement'],weight:0.65},
{id:'objects-alive',label:'Objects come to life',signals:['comes to life','come to life','magical object','living doll'],weight:0.65},
{id:'parallel-life',label:'Time travel / parallel-universe life',signals:['time travel','alternate reality','parallel universe','another timeline'],weight:0.65},
{id:'free-food',label:'Free food',signals:['free food','complimentary meal','on the house','free dinner'],weight:0.58},
];
export const SEASONAL={
Christmas:['Hot cocoa fixes everything','A town Christmas tree lighting','A snowstorm changes plans','Mistletoe appears at the perfect time','Christmas cookies are plot-critical','A festive fundraiser','A Christmas market','A Christmas Eve deadline','A tree-decorating scene','A magical snowfall','A holiday parade','A Christmas wish','A Christmas carol','An ugly Christmas sweater','A last-minute Christmas gift','A cozy fireplace moment','A holiday baking contest','A Christmas miracle','An unexpected sleigh ride','A family holiday tradition','Christmas lights everywhere','A charming tree farm','An overdecorated small town','An emotional holiday reunion','A festive kiss','Meddling Santas','Snowball fights','Snow angels'],
Fall:['Pumpkin patch encounter','Apple cider conversation','A scenic hayride','Autumn leaves everywhere','Harvest festival showdown','A flannel-clad love interest','Bonfire heart-to-heart','Pie contest rivalry','Corn maze mishap','Pumpkin carving','Family orchard crisis','Apple-picking date','A cozy sweater','Fall decorations montage','Small-town fall fair','A farm stand meet-cute','A harvest dance','An autumn sunset kiss','Pumpkin spice is mentioned','A festival deadline','Scarecrow sighting','A barn party','A leaf-peeping trip','An unexpected autumn storm','A fall tradition'],
Horror:['Someone ignores a clear warning','A suspiciously unlocked door','A creepy basement visit','Someone splits up','A flashlight fails','A jump scare','A power outage','A mysterious noise','A character has no signal','An ominous reflection','A car refuses to start','A false alarm','A strange symbol','A locked room','A terrifying phone call','An old diary','A character runs upstairs','A suspicious stranger','Footsteps with no explanation','A sudden scream','A door slams','An eerie photograph','A shadow moves','Someone says it is probably nothing','A final survivor']
};
// Free, offline, explainable lexical inference. No LLM subscription or network call.
const norm=x=>String(x||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const tokens=s=>new Set(norm(s).split(' ').filter(w=>w.length>2));
const aliases={
'return-home':['back to her hometown','back to his hometown','comes home','goes home','returns to her hometown','returns to his hometown'],
'old-flame':['former sweetheart','former boyfriend','former girlfriend','high school crush','teenage sweetheart','past love','former lover'],
'career-vs-love':['new position','work opportunity','takes a job','corporate job','professional ambitions'],
'save-the-business':['save her family','save his family','closing down','financial trouble','family store','family business'],
'forced-proximity':['stuck together','trapped together','forced to work','unexpected detour','snowed in'],
'town-event':['tree lighting','harvest festival','christmas festival','annual parade','town celebration'],
'family-pressure':['family obligations','family tradition','her father','his mother','her mother','his father'],
'rival':['romantic rival','former fiance','former fiancée','love triangle'],
'decorating':['christmas lights','decorates the tree','holiday decorating'],
};
// Map our original controlled story facts to original Bingo predictions.
const FACT_TROPE_HINTS={
 'return-home':['hometown','small town'],  'career-vs-love':['career choice'],'save-the-business':['business at risk'],
 'forced-proximity':['travel disruption'], 'family-pressure':['family dispute'],'rival':['rivals'],
 'deadline':['deadline'],'townspeople':['small town'],
 'big-city':['big city'],'small-town-magic':['small town'],
 'misunderstanding':['misunderstanding'],'family-heirloom':['inheritance'],
 'town-event':['festival','harvest','parade'],'hidden-talent':['baking contest'],
 'decorating':['christmas'],'old-flame':['former sweethearts','childhood friends']
};
const stop=new Set(['the','and','with','for','from','into','their','this','that','her','his','she','him','they','while','during','about','under','over','after','before','through','back']);
const contexts={
Christmas:['christmas','holiday','snow','winter','mistletoe','santa','reindeer','carol','tree','cocoa','gift','december','north pole'],
Fall:['fall','autumn','harvest','pumpkin','apple','orchard','cider','leaves','festival','farm','october'],
Horror:['horror','haunted','ghost','killer','murder','monster','dark','scream','haunting','curse','nightmare']
};
export function inferSeason(movie){if(contexts[movie?.season])return movie.season;const text=norm([movie?.title,movie?.synopsis,movie?.description].join(' '));let best='Christmas',score=0;for(const [season,terms] of Object.entries(contexts)){const n=terms.filter(t=>(' '+text+' ').includes(' '+t+' ')).length;if(n>score){best=season;score=n}}return best}
export function analyzeMovie(movie){
 const title=String(movie?.title||'').slice(0,250),synopsis=String(movie?.synopsis||movie?.description||'').slice(0,6000),season=inferSeason(movie);
 const text=norm(title+' '+synopsis+' '+factKeywords(movie?.story_facts).join(' ')), wordset=tokens(text);
 const cheese=CHEESE.map(t=>{
 const signals=[...t.signals,...(aliases[t.id]||[]),...(FACT_TROPE_HINTS[t.id]||[])];
 const hits=signals.filter(s=>{const term=norm(s);return term.includes(' ')?(' '+text+' ').includes(' '+term+' '):wordset.has(term)});
 const confidence=Math.min(.94,Math.max(.25,t.weight+(hits.length?Math.min(.16,.06*hits.length):-.22)));
 return {...t,category:'cheese',confidence,reason:hits.length?'Story fact/title clues: '+hits.slice(0,4).join(', '):'Genre prediction only — no supporting plot clue',evidence:hits.length?'synopsis':'prediction',observable_trigger:t.label,verified:false};
 }).sort((a,b)=>b.confidence-a.confidence||a.id.localeCompare(b.id));
 const seasonal=(SEASONAL[season]||SEASONAL.Christmas).map((label,i)=>{
 const meaningful=norm(label).split(' ').filter(w=>w.length>3&&!stop.has(w));
 const hits=meaningful.filter(w=>wordset.has(w));
 return {id:'season-'+season+'-'+i,label,category:'seasonal',confidence:Math.min(.86,.53+hits.length*.09),reason:hits.length?'Story fact/title topic overlap: '+hits.join(', '):'Seasonal convention — not confirmed',evidence:'prediction',verified:false,observable_trigger:label};
 }).sort((a,b)=>b.confidence-a.confidence||a.id.localeCompare(b.id));
 return {cheese,seasonal,season,engine:'offline-explainable-v2',generativeAI:false,verifiedScenes:false,disclaimer:'Plot clues are not scene verification. Only viewers can confirm squares.'};
}
export function seededRandom(seed){let s=seed>>>0;return ()=>{s=(s+0x6d2b79f5)>>>0;let t=Math.imul(s^(s>>>15),1|s);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296}}
export function shuffle(items,rng){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
export function buildCard(movie,{seed=1,free=true,cheeseRatio=.5,difficulty='balanced',locked={}}={}){if(!Number.isSafeInteger(seed)||seed<0)throw Error('Invalid card seed');if(!Number.isFinite(cheeseRatio)||cheeseRatio<0||cheeseRatio>1)throw Error('Invalid trope ratio');const {cheese,seasonal}=analyzeMovie(movie);const rng=seededRandom(seed);const count=free?24:25;const nCheese=Math.round(count*cheeseRatio);const target=difficulty==='easy'?[.72,1]:difficulty==='hard'?[0,.7]:[0,1];const choose=(arr,n)=>{const eligible=arr.filter(t=>t.confidence>=target[0]&&t.confidence<=target[1]);const preferred=eligible.length>=n?eligible:arr;const ranked=shuffle(preferred,rng).sort((a,b)=>difficulty==='hard'?a.confidence-b.confidence:b.confidence-a.confidence);return ranked.slice(0,n)};let selected=[...choose(cheese,nCheese),...choose(seasonal,count-nCheese)];if(selected.length!==count)throw Error('Not enough distinct tropes');selected=shuffle(selected,rng);
// Spread categories across rows rather than letting all rare/similar squares cluster.
const cheeseItems=selected.filter(t=>t.category==='cheese');
const seasonalItems=selected.filter(t=>t.category==='seasonal');
const layout=[];for(let i=0;i<count;i++){const remaining=count-i;const targetCheese=cheeseItems.length/remaining;const preferred=(i%2===0?cheeseItems:seasonalItems);const alternate=(i%2===0?seasonalItems:cheeseItems);const source=preferred.length&&((preferred===cheeseItems&&targetCheese>=.3)||(preferred===seasonalItems&&targetCheese<=.7))?preferred:(alternate.length?alternate:preferred);layout.push(source.shift())}
selected=layout;if(free)selected.splice(12,0,{id:'free',label:'FREE SPACE',category:'free',confidence:1,reason:'Free center',evidence:'rule'});const ids=new Set();return selected.map((t,i)=>{const override=locked[i];const item=override?{...override}:t;if(ids.has(item.id))throw Error('Duplicate locked trope: '+item.label);ids.add(item.id);return item})}
export function replaceSquare(card,index,trope){if(!Array.isArray(card)||card.length!==25||index<0||index>24||!Number.isInteger(index))throw Error('Invalid square');if(card[index].category==='free')throw Error('Cannot edit free center');if(card.some((t,i)=>i!==index&&t.id===trope.id))throw Error('This trope is already on your card');const next=[...card];next[index]={...trope};return next}
export function balance(card){const playable=card.filter(t=>t.category!=='free');return {cheese:playable.filter(t=>t.category==='cheese').length,seasonal:playable.filter(t=>t.category==='seasonal').length,total:playable.length}}
