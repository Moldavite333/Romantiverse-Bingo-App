import {recognizeCheeseConcepts} from './cheeseMasterConcepts.mjs';
// Original, controlled vocabulary. The input description is transient; only tags leave this function.
// This reduces retention/republication risk; it does not override website access terms.
const PATTERNS={
 setting:['small_town','big_city','hometown','farm','bakery','inn','bookstore','office','mountains','cabin','orchard','restaurant','hospital'],
 relationship:['former_sweethearts','childhood_friends','strangers','rivals','fake_dating','engaged','married','family'],
 conflict:['business_at_risk','career_choice','inheritance','competition','misunderstanding','family_dispute','travel_disruption','deadline'],
 event:['festival','wedding','christmas','parade','fundraiser','baking_contest','snowstorm','harvest','holiday_party','reunion']
};
const RULES={
 small_town:/\b(small town|small-town|village)\b/i,big_city:/\b(big city|big-city|corporate|city executive)\b/i,
 hometown:/\b(home ?town|returns? home|back home|comes home)\b/i,farm:/\b(farm|ranch)\b/i,
 bakery:/\b(bakery|baker|baking)\b/i,inn:/\b(inn|bed and breakfast|b&b)\b/i,
 bookstore:/\b(bookstore|book shop)\b/i,office:/\b(office|corporate)\b/i,
 mountains:/\b(mountain|alpine)\b/i,cabin:/\b(cabin|lodge)\b/i,
 orchard:/\b(orchard|apple picking)\b/i,restaurant:/\b(restaurant|chef)\b/i,hospital:/\b(hospital|doctor|physician)\b/i,
 former_sweethearts:/\b(old flame|former (boyfriend|girlfriend|sweetheart)|first love|childhood sweetheart|teenage sweetheart|high school sweetheart)\b/i,
 childhood_friends:/\b(childhood friend|grew up together)\b/i,strangers:/\b(stranger|strangers)\b/i,
 rivals:/\b(rival|rivals|competitor|competing)\b/i,fake_dating:/\b(fake (dating|relationship)|pretend (to date|couple))\b/i,
 engaged:/\b(engaged|fianc[eé]e?)\b/i,married:/\b(married|marriage|husband|wife)\b/i,
 family:/\b(family|father|mother|sister|brother|parent)\b/i,
 business_at_risk:/\b(save (the|her|his|their) (business|bakery|inn|shop)|closing down|failing business|financial trouble|threatened with closure)\b/i,
 career_choice:/\b(career|promotion|corporate job|new job|work opportunity|lawyer|attorney|executive)\b/i,
 inheritance:/\b(inherit|inheritance|estate)\b/i,competition:/\b(contest|competition|compete|tournament|rival baker)\b/i,
 misunderstanding:/\b(misunderstanding|mistaken identity|mix.up|secret)\b/i,
 family_dispute:/\b(family dispute|legal dispute|family feud)\b/i,
 travel_disruption:/\b(stranded|flight canceled|detour|road closed|snowed in)\b/i,
 deadline:/\b(deadline|before christmas|by christmas|christmas eve|last chance)\b/i,
 festival:/\b(festival|fair|carnival)\b/i,wedding:/\b(wedding|bride|groom)\b/i,
 christmas:/\b(christmas|yuletide)\b/i,parade:/\b(parade)\b/i,
 fundraiser:/\b(fundraiser|charity auction|fundraising)\b/i,
 baking_contest:/\b(baking contest|pie contest|bake.off|bakeoff)\b/i,
 snowstorm:/\b(snowstorm|blizzard)\b/i,harvest:/\b(harvest|pumpkin patch|pumpkin festival)\b/i,
 holiday_party:/\b(holiday party|christmas party)\b/i,reunion:/\b(reunion|reunites|reconnects)\b/i
};
export const FACT_KEYS=Object.freeze(Object.values(PATTERNS).flat());
export function extractStoryFacts(description){
 const text=String(description||'').slice(0,12000);
 const facts={};
 const concepts=new Set(recognizeCheeseConcepts(text));
 const mappings={homecoming:'hometown',small_town:'small_town',big_city:'big_city',bakery:'bakery',inn:'inn',bookstore:'bookstore',mountain:'mountains',farm:'farm',restaurant:'restaurant',old_flame:'former_sweethearts',childhood:'childhood_friends',rivals:'rivals',fake_romance:'fake_dating',family_business:'family',career:'career_choice',business_risk:'business_at_risk',inheritance:'inheritance',contest:'competition',misunderstanding:'misunderstanding',estranged:'family_dispute',snow_trap:'travel_disruption',deadline:'deadline',festival:'festival',wedding:'wedding',fundraiser:'fundraiser',cookie_contest:'baking_contest',tree_lighting:'christmas',christmas_magic:'christmas',snow_trap:'snowstorm',fake_engagement:'engaged'};
 for(const [category,keys] of Object.entries(PATTERNS))facts[category]=keys.filter(k=>RULES[k].test(text)||[...concepts].some(c=>mappings[c]===k));
 return facts;
}
export function validateStoryFacts(input){
 const result={};
 for(const [category,keys] of Object.entries(PATTERNS)){
  const arr=input?.[category];if(arr!==undefined&&!Array.isArray(arr))throw Error('Invalid fact category '+category);
  result[category]=[...new Set((arr||[]).filter(k=>typeof k==='string'&&keys.includes(k)))];
 }
 return result;
}
export function factKeywords(input){
 const facts=validateStoryFacts(input);
 return Object.values(facts).flat().map(k=>k.replace(/_/g,' '));
}
