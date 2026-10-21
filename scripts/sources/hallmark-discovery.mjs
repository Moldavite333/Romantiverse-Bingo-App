// Research-only Hallmark discovery using search/news RSS. No HTML crawling.
// RSS entries are leads and URLs, not permission to republish full descriptions.
const FEEDS=[
 {id:'hallmark-premieres',label:'Hallmark premieres',q:'Hallmark Channel new original movie premiere 2026'},
 {id:'hallmark-countdown',label:'Countdown to Christmas',q:'Hallmark Countdown to Christmas 2026 movies'},
 {id:'hallmark-schedule',label:'Hallmark Channel TV movie schedule 2026'},
 {id:'hallmark-movies-mysteries',label:'Hallmark Mystery movies',q:'Hallmark Mystery new movie premiere 2026'}
];
export const HALLMARK_FEEDS=FEEDS.map(f=>({...f,url:'https://www.google.com/search?tbm=nws&q='+encodeURIComponent(f.q)}));
// Research links are provided for human review, NOT fetched automatically.
// Sources and terms change; no unsupported scraping or paid provider is assumed.
export const LISTING_SOURCES=[
 {id:'hallmark-official',label:'Hallmark Channel schedule',url:'https://www.hallmarkchannel.com/schedule',purpose:'Official schedule and descriptions; manual editorial reference only'},
 {id:'tvinsider',label:'TV Insider Hallmark schedule',url:'https://www.tvinsider.com/network/hallmark-channel/schedule/',purpose:'Independent TV movie and airdate cross-check'},
 {id:'tvpassport',label:'TV Passport Hallmark Eastern schedule',url:'https://www.tvpassport.com/tv-listings/stations/hallmark-channel-hd-eastern/6213',purpose:'Independent schedule and synopsis cross-check'}
];
export function normalizeTitle(value){return String(value||'').normalize('NFKD').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim()}
export function matchMovie(candidate,known){
 const title=normalizeTitle(candidate?.title);if(!title)return {status:'invalid',matches:[]};
 const matches=known.filter(m=>normalizeTitle(m.title)===title).map(m=>({id:m.id,title:m.title,year:m.release_year??null,yearConflict:Boolean(candidate.year&&m.release_year&&candidate.year!==m.release_year)}));
 return {status:matches.some(m=>!m.yearConflict)?'already_cataloged':matches.length?'possible_remake':'new_candidate',matches};
}
export function candidateQuality(c){
 const notes=[];let score=0;
 if(c.title&&normalizeTitle(c.title).length>=5)score+=2;else notes.push('missing usable title');
 if(c.year>=1980&&c.year<=2100)score++;else notes.push('year not confirmed');
 if(c.network&&/hallmark/i.test(c.network))score+=2;else notes.push('Hallmark network not confirmed');
 if(c.source_url?.startsWith('https://'))score++;else notes.push('missing source URL');
 if(c.synopsis&&c.synopsis.length>=60)score++;else notes.push('no useful licensed synopsis');
 return {score,max:7,notes,requires_review:true};
}
