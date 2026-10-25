// Shared, deterministic, offline SVG illustrations adapted from the Cheese Louise HQ trait-art library.
// No remote images, tracking, database calls, or user-specific data.
const TRAIT_ART_COLORS={cream:'#f4ead1',paper:'#fffaf0',green:'#173f36',red:'#c43e46',pink:'#e96b78',gold:'#d4a52e',ink:'#1d2924'};

function traitArtHash(text){
  let h=2166136261;
  for(const ch of String(text||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
  return h>>>0;
}
function traitArtSeed(name,category,extra=''){return traitArtHash(`${name}|${category}|${extra}`).toString(36).toUpperCase().slice(0,8)}
function traitArtPrompt(name,category){
  return `Cheese Louise Romantiverse trait icon: ${name}. Category: ${category||'Other'}. Vintage mid-century cheese-wrapper illustration inspired by the Romantiverse Cheese Traits reference: cream background, deep forest-green outlines, warm red/pink accents, gold highlights, simple centered symbolic icon, lightly distressed print texture, clean bold shapes, no text.`;
}

function traitArtMotif(name,category){
  const s=`${name||''} ${category||''}`.toLowerCase();
  const tests=[
    ['city',/big.city|corporate|another city|famous/],['homecoming',/return|hometown|comes home|homecoming/],['festival',/festival|pageant/],['holiday',/holiday|christmas wish|christmas star/],['snow',/snowed|snow.machine|storm|road closure|blizzard/],['business',/family business|save the family business|business at risk/],['inn',/inn|b&b|lodge/],['farm',/farm|ranch|vineyard|winery|tree farm/],['renovation',/renovat|carpenter|developer/],['bakery',/bakery|bake|cookie|cooking|restaurant/],['coffee',/coffee|cocoa|warm drink/],['book',/bookstore|newspaper/],['flower',/flower/],['career',/career|promotion|boss|work assignment|event planner/],['parent',/single parent|widow|parent|grandparent|family tragedy/],['pet',/animal|sidekick/],['local',/gruff|local/],['matchmaker',/matchmak/],['meddling',/meddling|aunt/],['elder',/elder|mentor/],['child',/child|kid/],['ex',/ex appears|old flame|dead spouse|breakup/],['enemies',/rivals|enemies/],['fake',/fake dating|fake relationship|fake engagement/],['friends',/friends to lovers/],['secondchance',/second chance|old flame/],['workplace',/workplace|work assignment/],['childhood',/childhood/],['admirer',/secret admirer/],['triangle',/triangle/],['bed',/one bed|roommate/],['kiss',/kiss/],['deadline',/deadline|last.minute/],['gears',/working together|labor montage/],['mistaken',/mistaken identity|royal mistaken/],['misunderstanding',/misunderstanding|miscommunication|one sentence/],['change',/plans change|ultimatum/],['competition',/contest|competition|competing/],['team',/team up|together/],['simple',/simpler life|small.town|quaint mountain|seaside/],['loveovercareer',/love over career|career.or.love|promotion vs hometown/],['touch',/touch/],['gesture',/grand romantic gesture|fundraiser/],['gift',/gift|inheritance/],['montage',/montage/],['dance',/dance/],['decorate',/decorat|tree.light/],['confession',/confession/],['travel',/airport|train|destination wedding/],['snowglobe',/snow globe/],['makeover',/makeover/],['singing',/carol|singing/],['snowplay',/snowball/],['magic',/magic|santa/],['everafter',/ever after/],['royal',/royal|prince|princess|castle|commoner/],['amnesia',/amnesia/],['villain',/villain|developer/],['town',/town|main street/]
  ];
  return (tests.find(([,re])=>re.test(s))||['cheese'])[0];
}

function traitArtSparkles(seed){
  const h=traitArtHash(seed);const pts=[[18+(h%11),19+((h>>3)%10)],[104-((h>>5)%13),22+((h>>9)%11)],[20+((h>>13)%9),103-((h>>17)%11)],[104-((h>>20)%12),104-((h>>24)%10)]];
  return pts.map(([x,y],i)=>i%2?`<circle cx="${x}" cy="${y}" r="2.2" fill="${TRAIT_ART_COLORS.gold}" opacity=".75"/>`:`<path d="M${x} ${y-4}v8M${x-4} ${y}h8" stroke="${TRAIT_ART_COLORS.gold}" stroke-width="2" stroke-linecap="round" opacity=".75"/>`).join('');
}
function traitArtHeart(x=64,y=62,s=1,color=TRAIT_ART_COLORS.red){return `<path d="M${x} ${y+12*s}C${x-22*s} ${y-2*s},${x-18*s} ${y-20*s},${x} ${y-10*s}C${x+18*s} ${y-20*s},${x+22*s} ${y-2*s},${x} ${y+12*s}Z" fill="${color}"/>`}
function traitArtTree(x=30,y=78,s=1){return `<path d="M${x} ${y-38*s}l${-17*s} ${26*s}h${10*s}l${-14*s} ${22*s}h${42*s}l${-14*s} ${-22*s}h${10*s}Z" fill="${TRAIT_ART_COLORS.green}"/><rect x="${x-3*s}" y="${y+7*s}" width="${6*s}" height="${12*s}" rx="1" fill="${TRAIT_ART_COLORS.gold}"/>`}
function traitArtIcon(key){
  const g=TRAIT_ART_COLORS.green,r=TRAIT_ART_COLORS.red,p=TRAIT_ART_COLORS.pink,y=TRAIT_ART_COLORS.gold,c=TRAIT_ART_COLORS.cream;
  switch(key){
    case 'town': return `<g stroke="${g}" stroke-width="4" stroke-linejoin="round"><path d="M20 88V53l22-16 20 16v35H20Z" fill="${r}"/><path d="M57 88V42l23-18 27 22v42H57Z" fill="${c}"/><path d="M74 88V67h14v21" fill="${y}"/></g>${traitArtTree(20,82,.55)}`;
    case 'city': return `<g fill="${g}"><rect x="19" y="46" width="22" height="46"/><rect x="45" y="27" width="28" height="65"/><rect x="77" y="38" width="31" height="54"/></g><g fill="${y}">${[26,34,52,62,82,92].map((x,i)=>`<rect x="${x}" y="${55+(i%2)*12}" width="6" height="7" rx="1"/>`).join('')}</g>`;
    case 'homecoming': return `<rect x="28" y="36" width="72" height="52" rx="10" fill="${r}" stroke="${g}" stroke-width="5"/><path d="M47 36v-8h34v8" fill="none" stroke="${g}" stroke-width="5"/>${traitArtHeart(64,58,.62,c)}`;
    case 'festival': return `<path d="M20 87V49l44-23 44 23v38" fill="${c}" stroke="${g}" stroke-width="5"/><path d="M20 49h88M38 39v48M64 26v61M90 39v48" stroke="${r}" stroke-width="7"/><path d="M64 26V13l18 7-18 7" fill="${y}" stroke="${g}" stroke-width="3"/>`;
    case 'holiday': return `<circle cx="64" cy="63" r="33" fill="none" stroke="${g}" stroke-width="13" stroke-dasharray="7 5"/>${traitArtHeart(64,64,.55,r)}<path d="M52 31l12-12 12 12" fill="none" stroke="${y}" stroke-width="7" stroke-linecap="round"/>`;
    case 'snow': return `<g stroke="${g}" stroke-width="5" stroke-linecap="round"><path d="M64 22v84M28 43l72 42M28 85l72-42"/><path d="M64 22l-8 9m8-9 8 9M64 106l-8-9m8 9 8-9"/></g>`;
    case 'business': return `<rect x="22" y="45" width="84" height="48" rx="5" fill="${c}" stroke="${g}" stroke-width="5"/><path d="M19 45l10-20h70l10 20" fill="${r}" stroke="${g}" stroke-width="5"/><path d="M30 25v20m16-20v20m18-20v20m18-20v20m17-20v20" stroke="${c}" stroke-width="5"/><rect x="53" y="61" width="22" height="32" fill="${y}" stroke="${g}" stroke-width="4"/>`;
    case 'inn': return `<path d="M20 91V50l44-27 44 27v41H20Z" fill="${y}" stroke="${g}" stroke-width="5"/><rect x="51" y="62" width="26" height="29" fill="${r}" stroke="${g}" stroke-width="4"/>${traitArtTree(26,89,.55)}${traitArtTree(102,90,.5)}`;
    case 'farm': return `<path d="M24 91V47l40-23 40 23v44" fill="${r}" stroke="${g}" stroke-width="5"/><rect x="50" y="60" width="28" height="31" fill="${c}" stroke="${g}" stroke-width="4"/><path d="M14 100c25-20 75-19 102 0" fill="none" stroke="${g}" stroke-width="5"/>`;
    case 'renovation': return `<path d="M33 94l47-55" stroke="${g}" stroke-width="12" stroke-linecap="round"/><path d="M68 30l13-13 28 27-13 13Z" fill="${r}" stroke="${g}" stroke-width="5"/><path d="M21 106l17-17" stroke="${y}" stroke-width="5"/>`;
    case 'bakery': return `<path d="M35 65h58l-8 35H43Z" fill="${r}" stroke="${g}" stroke-width="5"/><path d="M39 64c-6-19 12-25 22-14 6-20 28-13 26 3 17-1 20 17 6 21H39Z" fill="${c}" stroke="${g}" stroke-width="5"/><circle cx="64" cy="49" r="5" fill="${y}"/>`;
    case 'coffee': return `<path d="M31 50h58v37c0 12-10 20-22 20H53c-12 0-22-8-22-20V50Z" fill="${r}" stroke="${g}" stroke-width="5"/><path d="M89 58h10c16 0 16 25 0 25H89" fill="none" stroke="${g}" stroke-width="5"/><path d="M47 40c-8-11 8-14 0-25M66 40c-8-11 8-14 0-25" stroke="${g}" stroke-width="4" fill="none" stroke-linecap="round"/>${traitArtHeart(61,71,.42,c)}`;
    case 'book': return `<path d="M22 35c15-8 29-6 42 4v59c-13-10-27-12-42-4V35Zm84 0c-15-8-29-6-42 4v59c13-10 27-12 42-4V35Z" fill="${c}" stroke="${g}" stroke-width="5"/>${traitArtHeart(64,68,.38,r)}`;
    case 'flower': return `<g fill="${r}" stroke="${g}" stroke-width="3"><circle cx="64" cy="45" r="10"/><circle cx="47" cy="55" r="10"/><circle cx="81" cy="55" r="10"/><circle cx="53" cy="38" r="10"/><circle cx="75" cy="38" r="10"/></g><circle cx="64" cy="48" r="8" fill="${y}"/><path d="M64 57v43m0-20-18-12m18 18 20-14" stroke="${g}" stroke-width="5"/>`;
    case 'career': return `<rect x="26" y="42" width="76" height="54" rx="7" fill="${g}"/><path d="M47 42V31h34v11" fill="none" stroke="${g}" stroke-width="7"/><rect x="31" y="53" width="66" height="13" fill="${y}"/>${traitArtHeart(64,76,.36,r)}`;
    case 'parent': return `<circle cx="47" cy="46" r="16" fill="${p}" stroke="${g}" stroke-width="4"/><circle cx="80" cy="59" r="12" fill="${y}" stroke="${g}" stroke-width="4"/><path d="M26 101c4-26 36-32 48-11 6-15 29-15 36 11" fill="${c}" stroke="${g}" stroke-width="5"/>${traitArtHeart(67,72,.35,r)}`;
    case 'pet': return `<circle cx="64" cy="65" r="30" fill="${y}" stroke="${g}" stroke-width="5"/><path d="M39 47 26 30l3 32M89 47l13-17-3 32" fill="${y}" stroke="${g}" stroke-width="5"/><circle cx="53" cy="62" r="4" fill="${g}"/><circle cx="76" cy="62" r="4" fill="${g}"/><path d="M58 76q6 7 12 0" stroke="${g}" stroke-width="4" fill="none"/>${traitArtHeart(64,101,.28,r)}`;
    case 'matchmaker': return `<path d="M23 54h36v42H34c-7 0-11-6-11-13V54Zm82 0H69v42h25c7 0 11-6 11-13V54Z" fill="${r}" stroke="${g}" stroke-width="5"/>${traitArtHeart(64,43,.5,r)}`;
    case 'meddling': return `<circle cx="44" cy="60" r="20" fill="none" stroke="${g}" stroke-width="6"/><circle cx="84" cy="60" r="20" fill="none" stroke="${g}" stroke-width="6"/><path d="M64 60h1M24 55 13 48m91 7 11-7" stroke="${g}" stroke-width="6" stroke-linecap="round"/><path d="M42 87c11 9 34 9 45 0" stroke="${r}" stroke-width="5" fill="none"/>`;
    case 'elder': return `<path d="M45 35v48c0 20 9 28 29 28 16 0 27-9 27-22 0-10-8-18-19-18H49" fill="none" stroke="${g}" stroke-width="7" stroke-linecap="round"/><path d="M34 111h77" stroke="${y}" stroke-width="6" stroke-linecap="round"/>`;
    case 'child': return `<circle cx="64" cy="61" r="31" fill="${p}" stroke="${g}" stroke-width="5"/><path d="M37 43q27-34 54 0" fill="${g}"/><circle cx="53" cy="61" r="3" fill="${g}"/><circle cx="75" cy="61" r="3" fill="${g}"/><path d="M54 76q10 8 20 0" stroke="${r}" stroke-width="4" fill="none"/>${traitArtHeart(64,101,.25,r)}`;
    case 'ex': return `<path d="M64 103C24 75 29 35 53 35c8 0 12 5 17 12 5-7 9-12 17-12 24 0 27 39-23 68Z" fill="${r}"/><path d="M69 48 55 65l13 8-14 19" fill="none" stroke="${c}" stroke-width="6"/>`;
    case 'enemies': return `<path d="M26 95 88 34M102 95 40 34" stroke="${g}" stroke-width="7" stroke-linecap="round"/>${traitArtHeart(64,56,.42,r)}`;
    case 'fake': return `<path d="M21 42q22-19 43 1v42q-25 20-43-1V42Zm86 0Q85 23 64 43v42q25 20 43-1V42Z" fill="${p}" stroke="${g}" stroke-width="4"/><path d="M31 61q10 9 20 0m26 10q10-9 20 0" fill="none" stroke="${c}" stroke-width="4"/>`;
    case 'friends': return `<circle cx="45" cy="62" r="24" fill="${r}" stroke="${g}" stroke-width="5"/><circle cx="83" cy="62" r="24" fill="${g}" stroke="${g}" stroke-width="5"/>${traitArtHeart(64,62,.35,c)}`;
    case 'secondchance': return `<path d="M92 49A35 35 0 1 0 96 84" fill="none" stroke="${r}" stroke-width="9" stroke-linecap="round"/><path d="M93 35 96 55 78 51" fill="${r}"/>${traitArtHeart(62,67,.42,r)}`;
    case 'workplace': return `<rect x="24" y="34" width="80" height="58" rx="5" fill="${g}"/><rect x="32" y="42" width="64" height="42" fill="${c}"/>${traitArtHeart(64,62,.38,r)}<path d="M47 101h34" stroke="${g}" stroke-width="7"/>`;
    case 'childhood': return `<circle cx="45" cy="76" r="19" fill="none" stroke="${g}" stroke-width="5"/><circle cx="92" cy="76" r="19" fill="none" stroke="${g}" stroke-width="5"/><path d="M45 76 61 48h22l9 28M61 48l15 28M52 61h35" fill="none" stroke="${r}" stroke-width="5"/>${traitArtHeart(80,35,.28,p)}`;
    case 'admirer': return `<rect x="23" y="40" width="82" height="55" rx="4" fill="${c}" stroke="${p}" stroke-width="5"/><path d="M25 44 64 72l39-28" fill="none" stroke="${p}" stroke-width="5"/>${traitArtHeart(64,61,.36,r)}`;
    case 'triangle': return `${traitArtHeart(64,34,.38,r)}${traitArtHeart(41,78,.38,p)}${traitArtHeart(87,78,.38,g)}`;
    case 'bed': return `<rect x="23" y="55" width="82" height="36" rx="5" fill="${r}" stroke="${g}" stroke-width="5"/><rect x="28" y="43" width="30" height="20" rx="8" fill="${c}" stroke="${g}" stroke-width="4"/><path d="M23 91v15m82-15v15" stroke="${g}" stroke-width="6"/>${traitArtHeart(83,45,.25,r)}`;
    case 'kiss': return `<path d="M21 68c16-27 31-29 43-8 13-21 28-19 43 8-25 37-61 37-86 0Z" fill="${r}"/><path d="M31 68h66" stroke="${c}" stroke-width="4" opacity=".8"/>`;
    case 'deadline': return `<rect x="25" y="34" width="78" height="70" rx="5" fill="${c}" stroke="${r}" stroke-width="6"/><path d="M25 52h78M42 24v21M86 24v21" stroke="${g}" stroke-width="6"/>${traitArtHeart(64,76,.34,r)}`;
    case 'gears': return `<g fill="${g}"><circle cx="49" cy="58" r="22"/><circle cx="83" cy="79" r="18"/></g><g fill="${c}"><circle cx="49" cy="58" r="9"/><circle cx="83" cy="79" r="7"/></g>${traitArtHeart(83,41,.24,r)}`;
    case 'mistaken': return `<path d="M24 42q20-17 40 2v43q-23 18-40-2V42Zm80 0Q84 25 64 44v43q23 18 40-2V42Z" fill="${r}" stroke="${g}" stroke-width="4"/><path d="M35 62h12m34 0h12" stroke="${c}" stroke-width="5"/>`;
    case 'misunderstanding': return `<path d="M18 35h55v39H42L30 87v-13H18Z" fill="${p}"/><path d="M61 60h49v35H88l-10 12V95H61Z" fill="${g}"/>${traitArtHeart(64,65,.28,r)}`;
    case 'change': return `<path d="M64 24v84" stroke="${g}" stroke-width="7"/><path d="M61 39h40l-11 12 11 12H61M67 72H27l11 12-11 12h40" fill="${r}" stroke="${g}" stroke-width="4"/>`;
    case 'competition': return `<path d="M41 31h46v33c0 21-12 32-23 32S41 85 41 64V31Z" fill="${y}" stroke="${g}" stroke-width="5"/><path d="M41 42H25c0 20 7 29 22 31M87 42h16c0 20-7 29-22 31" fill="none" stroke="${g}" stroke-width="5"/><path d="M64 96v12M46 110h36" stroke="${g}" stroke-width="6"/>`;
    case 'team': return `<path d="M21 64 45 43l20 17 18-15 24 20-31 29-14-12-14 11Z" fill="${p}" stroke="${g}" stroke-width="5"/>${traitArtHeart(64,41,.25,r)}`;
    case 'simple': return `${traitArtTree(38,92,.72)}${traitArtTree(86,96,.55)}<path d="M18 93 48 55l16 18 17-27 29 47Z" fill="${c}" stroke="${g}" stroke-width="5"/>`;
    case 'loveovercareer': return `<rect x="22" y="48" width="84" height="52" rx="7" fill="${g}"/><path d="M45 48V35h38v13" fill="none" stroke="${g}" stroke-width="7"/>${traitArtHeart(64,72,.52,r)}`;
    case 'touch': return `<path d="M17 72c19-20 27-20 42-8l8 8 8-8c15-12 23-12 42 8" fill="none" stroke="${g}" stroke-width="10" stroke-linecap="round"/>${traitArtHeart(67,50,.28,r)}`;
    case 'gesture': return `${traitArtHeart(64,66,.5,r)}<g stroke="${r}" stroke-width="4" stroke-linecap="round"><path d="M64 17v15M23 34l12 10M105 34 93 44M17 74h16M111 74H95"/></g>`;
    case 'gift': return `<rect x="24" y="51" width="80" height="52" rx="4" fill="${r}" stroke="${g}" stroke-width="5"/><path d="M64 51v52M19 51h90V36H19Z" fill="${y}" stroke="${g}" stroke-width="5"/><path d="M64 36c-21 1-24-18-11-19 8-1 11 7 11 19Zm0 0c21 1 24-18 11-19-8-1-11 7-11 19Z" fill="${p}" stroke="${g}" stroke-width="3"/>`;
    case 'montage': return `<path d="M24 38h80v62H24Z" fill="${g}"/><path d="M24 38h80l-8-18H16Z" fill="${c}" stroke="${g}" stroke-width="5"/><path d="M31 23l10 15m15-15 10 15m15-15 10 15" stroke="${r}" stroke-width="5"/>${traitArtHeart(64,70,.35,r)}`;
    case 'dance': return `<circle cx="64" cy="59" r="35" fill="none" stroke="${g}" stroke-width="5"/><path d="M64 24v70M29 59h70M38 38c15 13 37 13 52 0M38 80c15-13 37-13 52 0" stroke="${g}" stroke-width="3"/>${traitArtHeart(64,103,.25,r)}`;
    case 'decorate': return `<path d="M17 44c28 21 66 21 94 0" fill="none" stroke="${g}" stroke-width="4"/>${[27,45,64,83,101].map((x,i)=>`<path d="M${x} ${50+i%2*5}v14" stroke="${g}" stroke-width="3"/><circle cx="${x}" cy="${68+i%2*5}" r="7" fill="${i%2?r:y}"/>`).join('')}`;
    case 'confession': return `<path d="M19 34h90v58H62l-20 18V92H19Z" fill="${p}" stroke="${g}" stroke-width="5"/>${traitArtHeart(64,62,.38,r)}`;
    case 'travel': return `<path d="M17 73 111 44 76 74v28l-15-20-25 11 3-19Z" fill="${g}"/>${traitArtHeart(92,34,.24,r)}`;
    case 'snowglobe': return `<circle cx="64" cy="58" r="36" fill="${c}" stroke="${g}" stroke-width="5"/>${traitArtTree(64,70,.55)}<path d="M38 100h52l8 13H30Z" fill="${r}" stroke="${g}" stroke-width="4"/><g fill="${p}"><circle cx="42" cy="49" r="3"/><circle cx="76" cy="39" r="3"/><circle cx="87" cy="64" r="3"/></g>`;
    case 'makeover': return `<ellipse cx="64" cy="59" rx="31" ry="39" fill="${c}" stroke="${y}" stroke-width="7"/><ellipse cx="64" cy="59" rx="19" ry="27" fill="none" stroke="${g}" stroke-width="4"/>${traitArtHeart(64,59,.25,r)}`;
    case 'singing': return `<path d="M49 28v55c-9-7-25-3-25 9 0 15 25 15 25-4V46l39-9v37c-9-7-25-3-25 9 0 15 25 15 25-4V20Z" fill="${g}"/>${traitArtHeart(101,95,.22,r)}`;
    case 'snowplay': return `<circle cx="64" cy="78" r="26" fill="${c}" stroke="${g}" stroke-width="4"/><circle cx="64" cy="43" r="19" fill="${c}" stroke="${g}" stroke-width="4"/><circle cx="58" cy="40" r="3" fill="${g}"/><circle cx="70" cy="40" r="3" fill="${g}"/><path d="M31 71 12 58M97 71l19-13" stroke="${g}" stroke-width="5"/><path d="M50 25h28l-5-12H55Z" fill="${r}"/>`;
    case 'magic': return `<path d="M29 101 93 31" stroke="${g}" stroke-width="9" stroke-linecap="round"/><path d="m97 18 5 13 14 1-11 9 3 14-11-8-12 8 4-14-11-9 14-1Z" fill="${y}" stroke="${g}" stroke-width="3"/>${traitArtSparkles('magic')}`;
    case 'everafter': return `${traitArtHeart(51,61,.58,r)}${traitArtHeart(77,61,.58,p)}`;
    case 'royal': return `<path d="M27 82 20 38l25 22 19-35 19 35 25-22-7 44Z" fill="${y}" stroke="${g}" stroke-width="5"/><rect x="28" y="82" width="72" height="16" rx="4" fill="${r}" stroke="${g}" stroke-width="4"/>${traitArtHeart(64,68,.25,r)}`;
    case 'amnesia': return `<circle cx="64" cy="59" r="36" fill="${c}" stroke="${g}" stroke-width="5"/><text x="64" y="72" text-anchor="middle" font-family="Georgia,serif" font-size="56" font-weight="900" fill="${r}">?</text>`;
    case 'villain': return `<path d="M18 86h87l-11 18H29Z" fill="${g}"/><rect x="32" y="48" width="44" height="37" fill="${r}" stroke="${g}" stroke-width="5"/><circle cx="42" cy="106" r="8" fill="${y}"/><circle cx="88" cy="106" r="8" fill="${y}"/><path d="M77 49h24l14 37h-39Z" fill="${y}" stroke="${g}" stroke-width="5"/>`;
    default: return `<path d="M26 36 94 47v43l-68 4Z" fill="${y}" stroke="${g}" stroke-width="5"/><circle cx="47" cy="58" r="6" fill="${c}"/><circle cx="74" cy="72" r="7" fill="${c}"/>${traitArtHeart(93,91,.28,r)}`;
  }
}

function traitArtSvg(name,category,seed=''){
  const motif=traitArtMotif(name,category);const s=seed||traitArtSeed(name,category);
  const C=TRAIT_ART_COLORS;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="${String(name||'Cheese Trait').replace(/[&<>\"]/g,'')}"><rect width="128" height="128" rx="18" fill="${C.cream}"/><rect x="4" y="4" width="120" height="120" rx="15" fill="none" stroke="${C.green}" stroke-width="4" opacity=".9"/>${traitArtSparkles(s)}<g transform="translate(0 0)">${traitArtIcon(motif)}</g><path d="M12 113c28 6 76 6 104 0" fill="none" stroke="${C.red}" stroke-width="3" opacity=".28"/></svg>`;
}

const TRAIT_ART_STYLE_V2='romantiverse-v2';
const traitArtV1Motif=traitArtMotif;
const traitArtV1Icon=traitArtIcon;


traitArtMotif=function(name,category){
  const s=`${name||''} ${category||''}`.toLowerCase();

  // Exact concepts from the live Cheese Trait library get first-class art.
  if(/family fued|family feud|estranged family/.test(s)) return 'familyfeud';
  if(/diner|family restaurant/.test(s)) return 'diner';
  if(/dead parent|dead grandparent|sick parent|sick grandparent|family tragedy/.test(s)) return 'memorial';
  if(/widowed single parent|single-parent romance/.test(s)) return 'singleparent';
  if(/jealous rival/.test(s)) return 'jealous';
  if(/third-act breakup/.test(s)) return 'breakup';
  if(/child plays matchmaker/.test(s)) return 'childmatch';
  if(/town knows before they do/.test(s)) return 'gossip';
  if(/inheritance with conditions|inherited family business/.test(s)) return 'inheritance';
  if(/destination wedding/.test(s)) return 'wedding';
  if(/seaside town/.test(s)) return 'seaside';
  if(/quaint mountain town/.test(s)) return 'mountain';
  if(/small-town newspaper/.test(s)) return 'newspaper';
  if(/flower shop/.test(s)) return 'flowershop';
  if(/apple cider|hot chocolate/.test(s)) return 'warmdrink';
  if(/boss sends them home/.test(s)) return 'bosshome';
  if(/career-or-love ultimatum|promotion vs hometown/.test(s)) return 'careerchoice';
  if(/ex appears at worst time/.test(s)) return 'ex';
  if(/accidental roommates/.test(s)) return 'roommates';

  const old=traitArtV1Motif(name,category);
  if(old!=='cheese') return old;

  // Category fallback ensures an unknown trait still gets relevant art, never generic cheese.
  if(/career/.test(s)) return 'career';
  if(/family/.test(s)) return 'parent';
  if(/royal/.test(s)) return 'royal';
  if(/romance/.test(s)) return 'friends';
  if(/location/.test(s)) return 'town';
  if(/job|business/.test(s)) return 'business';
  if(/plot/.test(s)) return 'story';
  return 'story';
};

traitArtIcon=function(key){
  const g=TRAIT_ART_COLORS.green,r=TRAIT_ART_COLORS.red,p=TRAIT_ART_COLORS.pink,y=TRAIT_ART_COLORS.gold,c=TRAIT_ART_COLORS.cream;
  switch(key){
    case 'familyfeud':
      return `<g stroke="${g}" stroke-width="4" stroke-linecap="round"><circle cx="35" cy="44" r="13" fill="${p}"/><circle cx="93" cy="44" r="13" fill="${y}"/><path d="M20 90c2-25 28-30 39-10M108 90c-2-25-28-30-39-10" fill="${c}"/><path d="M25 69h23M80 69h23" /></g><path d="M64 24 55 43l11 8-10 18 14 10-8 25" fill="none" stroke="${r}" stroke-width="7"/><path d="M64 64C42 49 46 33 58 34c4 0 6 3 8 7 3-4 5-7 9-7 12-1 15 15-11 30Z" fill="${r}"/>`;
    case 'diner':
      return `<path d="M18 91h92" stroke="${g}" stroke-width="5"/><rect x="24" y="42" width="80" height="49" rx="8" fill="${c}" stroke="${g}" stroke-width="5"/><path d="M24 54h80" stroke="${r}" stroke-width="8"/><rect x="38" y="65" width="18" height="26" fill="${y}" stroke="${g}" stroke-width="4"/><rect x="69" y="64" width="22" height="13" fill="${p}" stroke="${g}" stroke-width="4"/><circle cx="80" cy="83" r="5" fill="${r}"/>`;
    case 'memorial':
      return `<path d="M64 25c-14 18-18 31-18 42 0 12 8 21 18 21s18-9 18-21c0-11-4-24-18-42Z" fill="${y}" stroke="${g}" stroke-width="4"/><rect x="53" y="88" width="22" height="18" rx="3" fill="${r}" stroke="${g}" stroke-width="4"/><path d="M30 107h68" stroke="${g}" stroke-width="5"/>`;
    case 'singleparent':
      return `<circle cx="48" cy="45" r="17" fill="${p}" stroke="${g}" stroke-width="4"/><circle cx="79" cy="60" r="11" fill="${y}" stroke="${g}" stroke-width="4"/><path d="M25 102c4-25 35-30 48-10 6-15 28-14 34 10" fill="${c}" stroke="${g}" stroke-width="5"/>${traitArtHeart(71,80,.28,r)}`;
    case 'jealous':
      return `${traitArtHeart(53,64,.48,r)}<circle cx="92" cy="53" r="18" fill="${y}" stroke="${g}" stroke-width="4"/><path d="M84 51h5m8 0h5M86 62q7-6 14 0" stroke="${g}" stroke-width="4" fill="none"/><path d="M72 30 61 18" stroke="${p}" stroke-width="5"/>`;
    case 'breakup':
      return `<path d="M64 104C24 76 30 35 53 35c8 0 12 5 17 12 5-7 9-12 17-12 23 0 28 40-23 69Z" fill="${r}"/><path d="M68 45 55 61l13 9-15 20" fill="none" stroke="${c}" stroke-width="7"/>`;
    case 'childmatch':
      return `<circle cx="64" cy="56" r="25" fill="${y}" stroke="${g}" stroke-width="5"/><path d="M39 100c5-20 45-20 50 0" fill="${c}" stroke="${g}" stroke-width="5"/>${traitArtHeart(35,38,.25,r)}${traitArtHeart(94,38,.25,p)}`;
    case 'gossip':
      return `<circle cx="44" cy="58" r="19" fill="${p}" stroke="${g}" stroke-width="4"/><circle cx="84" cy="58" r="19" fill="${y}" stroke="${g}" stroke-width="4"/><path d="M57 57h14" stroke="${r}" stroke-width="5" stroke-dasharray="3 5"/><path d="M28 99c5-20 29-20 34 0M66 99c5-20 29-20 34 0" fill="${c}" stroke="${g}" stroke-width="4"/>`;
    case 'inheritance':
      return `<rect x="28" y="29" width="72" height="78" rx="5" fill="${c}" stroke="${g}" stroke-width="5"/><path d="M40 48h48M40 61h39M40 74h46" stroke="${g}" stroke-width="4"/><circle cx="82" cy="91" r="12" fill="${r}"/><path d="m77 91 4 4 8-10" stroke="${c}" stroke-width="3" fill="none"/>`;
    case 'wedding':
      return `<circle cx="52" cy="64" r="25" fill="none" stroke="${y}" stroke-width="9"/><circle cx="77" cy="64" r="25" fill="none" stroke="${r}" stroke-width="9"/><path d="M64 25 70 37 83 39 74 48 76 61 64 55 52 61 54 48 45 39 58 37Z" fill="${p}"/>`;
    case 'seaside':
      return `<path d="M15 83q18-15 36 0t36 0 26 0" fill="none" stroke="${g}" stroke-width="6"/><circle cx="91" cy="36" r="16" fill="${y}"/><path d="M27 78 53 43l22 35Z" fill="${c}" stroke="${g}" stroke-width="4"/>`;
    case 'mountain':
      return `<path d="M15 98 48 46l15 22 18-31 32 61Z" fill="${c}" stroke="${g}" stroke-width="5"/><path d="m48 46 8 12-13 1m38-22 10 18-15-3" fill="${y}" stroke="${g}" stroke-width="3"/>`;
    case 'newspaper':
      return `<rect x="20" y="30" width="88" height="70" rx="4" fill="${c}" stroke="${g}" stroke-width="5"/><path d="M30 43h45M30 53h68M30 66h28M30 76h28M67 66h31v24H67Z" stroke="${g}" stroke-width="4" fill="none"/>`;
    case 'flowershop':
      return `<path d="M22 91h84V54H22Z" fill="${c}" stroke="${g}" stroke-width="5"/><path d="M18 54 30 31h68l12 23" fill="${r}" stroke="${g}" stroke-width="5"/><g fill="${p}" stroke="${g}" stroke-width="2"><circle cx="52" cy="72" r="9"/><circle cx="67" cy="68" r="8"/><circle cx="79" cy="76" r="9"/></g>`;
    case 'warmdrink':
      return `<path d="M29 52h62v35c0 14-10 21-24 21H53c-14 0-24-7-24-21V52Z" fill="${r}" stroke="${g}" stroke-width="5"/><path d="M91 60h9c15 0 15 22 0 22h-9" fill="none" stroke="${g}" stroke-width="5"/><path d="M48 40c-7-10 7-13 0-24M67 40c-7-10 7-13 0-24" fill="none" stroke="${g}" stroke-width="4"/>`;
    case 'bosshome':
      return `<rect x="23" y="35" width="60" height="45" rx="5" fill="${g}"/><path d="M35 35V25h36v10" stroke="${g}" stroke-width="6"/><path d="M73 100 103 70M87 69h17v18" fill="none" stroke="${r}" stroke-width="7"/><path d="M63 101H31V78" fill="none" stroke="${y}" stroke-width="7"/>`;
    case 'careerchoice':
      return `<rect x="18" y="54" width="45" height="37" rx="5" fill="${g}"/>${traitArtHeart(88,69,.55,r)}<path d="M64 28v72" stroke="${y}" stroke-width="5" stroke-dasharray="5 5"/>`;
    case 'roommates':
      return `<rect x="18" y="55" width="92" height="40" rx="6" fill="${r}" stroke="${g}" stroke-width="5"/><rect x="25" y="43" width="34" height="19" rx="8" fill="${c}" stroke="${g}" stroke-width="4"/><rect x="69" y="43" width="34" height="19" rx="8" fill="${c}" stroke="${g}" stroke-width="4"/><path d="M64 55v40" stroke="${g}" stroke-width="4"/>`;
    case 'story':
      return `<path d="M24 38h80v61H24Z" fill="${g}"/><path d="M24 38h80l-8-17H16Z" fill="${c}" stroke="${g}" stroke-width="5"/><path d="M31 23l10 15m15-15 10 15m15-15 10 15" stroke="${r}" stroke-width="5"/>${traitArtHeart(64,69,.30,r)}`;
    default:
      return traitArtV1Icon(key);
  }
};



const sourceMotif=traitArtMotif;
traitArtMotif=function(name,category){
 const s=String(name||'').toLowerCase();
 if(category==='free')return 'holiday';
 if(category==='seasonal'){
  const patterns=[
   ['pumpkin',/pumpkin|scarecrow/],['apple',/apple|orchard/],['leaf',/leaves|autumn leaves|leaf.peeping/],
   ['bonfire',/bonfire|fireplace|campfire/],['ghost',/ghost|haunt|shadow|ominous|eerie|creepy/],
   ['door',/door|basement|locked room/],['flashlight',/flashlight|power outage|no signal|phone call/],
   ['coffee',/cider|cocoa|hot chocolate|pumpkin spice/],['bakery',/pie|baking|cookie/],
   ['festival',/festival|fair|parade|contest|dance|pageant/],['farm',/hayride|barn|corn maze|farm stand/],
   ['snow',/snow|winter storm|blizzard/],['kiss',/kiss/],['gift',/gift|present/],
   ['decorate',/lights|decorat|tree lighting/],['travel',/car|sleigh|ride|road trip/],
   ['book',/diary|photograph/],['holiday',/christmas|holiday|mistletoe/]
  ];
  const found=patterns.find(([,re])=>re.test(s));
  if(found)return found[0];
 }
 return sourceMotif(name,category);
};
const sourceIcon=traitArtIcon;
traitArtIcon=function(key){
 const g=TRAIT_ART_COLORS.green,r=TRAIT_ART_COLORS.red,p=TRAIT_ART_COLORS.pink,y=TRAIT_ART_COLORS.gold,c=TRAIT_ART_COLORS.cream;
 switch(key){
  case 'pumpkin':return `<ellipse cx="64" cy="69" rx="38" ry="31" fill="${r}" stroke="${g}" stroke-width="5"/><path d="M64 40V28q14-9 22 0" fill="none" stroke="${g}" stroke-width="6"/><path d="M45 45q-13 25 0 49M83 45q13 25 0 49" stroke="${y}" stroke-width="4" fill="none"/><path d="M45 70l11-9 8 9 9-9 11 9" stroke="${c}" stroke-width="4" fill="none"/> `;
  case 'apple':return `<path d="M65 44C29 20 20 59 32 87c9 22 23 16 33 12 10 4 24 10 33-12 12-28 3-67-33-43Z" fill="${r}" stroke="${g}" stroke-width="5"/><path d="M65 46V23M65 29q18-15 30-2-14 14-30 2" fill="${y}" stroke="${g}" stroke-width="5"/>`;
  case 'leaf':return `<path d="M23 90Q20 31 105 24 102 107 43 105Z" fill="${y}" stroke="${g}" stroke-width="5"/><path d="M24 112 83 49M52 82l-3-28m21 10 24 4" fill="none" stroke="${r}" stroke-width="5" stroke-linecap="round"/>`;
  case 'bonfire':return `<path d="M23 98 104 81M25 81l79 17" stroke="${g}" stroke-width="9" stroke-linecap="round"/><path d="M64 91C32 73 52 50 54 36c7 5 11 12 12 17 6-17 15-27 17-33 23 36 24 59-19 71Z" fill="${r}" stroke="${g}" stroke-width="4"/><path d="M64 88C48 73 67 57 72 48c12 21 12 33-8 40Z" fill="${y}"/>`;
  case 'ghost':return `<path d="M29 102V56c0-25 15-39 35-39s35 14 35 39v46l-17-11-18 11-18-11Z" fill="${c}" stroke="${g}" stroke-width="5"/><circle cx="51" cy="57" r="7" fill="${g}"/><circle cx="77" cy="57" r="7" fill="${g}"/><path d="M56 79q8-8 16 0" fill="none" stroke="${r}" stroke-width="4"/>`;
  case 'door':return `<rect x="30" y="19" width="68" height="91" rx="5" fill="${c}" stroke="${g}" stroke-width="6"/><path d="M40 31h48v69H40Z" fill="${r}" stroke="${g}" stroke-width="4"/><circle cx="78" cy="70" r="5" fill="${y}"/><path d="M20 112h88" stroke="${g}" stroke-width="5"/>`;
  case 'flashlight':return `<path d="M28 75 72 57l14 18-41 31Z" fill="${g}"/><path d="m71 57 10-8 20 27-15 1Z" fill="${r}" stroke="${g}" stroke-width="4"/><path d="m93 46 15-17M99 56l21-7M81 42l4-23" stroke="${y}" stroke-width="5" stroke-linecap="round"/>`;
  default:return sourceIcon(key);
 }
};
export function tropeArtDataUri(trope){
 const label=String(trope?.label||'Cheese Trait').slice(0,200);
 const category=trope?.category==='seasonal'?'seasonal':trope?.category==='free'?'free':'cheese';
 return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(traitArtSvg(label,category,traitArtSeed(label,category,'stable')));
}
