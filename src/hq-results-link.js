import {snapshots,summarizeResults,sameMovie,allowedHqOrigin} from './engine/hqResults.mjs';
// Only explicit card results leave Bingo. Room credentials and HQ notes never travel through this link.
const params=new URLSearchParams(location.search),origin=params.get('hqOrigin'),nonce=params.get('hqNonce');
const requested=allowedHqOrigin(origin)&&/^[a-z0-9-]{16,100}$/i.test(nonce||'')&&window.opener;
const target={title:params.get('hqMovie')||'',year:Number(params.get('hqYear'))||null};
let selected='',linked='',last='',panel=null,select=null,status=null,rows=[];
const button=(text,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=fn;return b};
function send(){const card=rows.find(c=>c.id===linked);if(!card||!requested||window.opener.closed)return;const fingerprint=JSON.stringify({...card,updatedAt:''});if(fingerprint===last)return;window.opener.postMessage({type:'cl-bingo-results',nonce,result:card},origin);last=fingerprint;status.textContent='Linked card updates are sent to HQ while both tabs stay open. Your HQ notes stay private.';}
function install(){
 panel=document.createElement('details');panel.className='panel';panel.id='hq-results-link';panel.style.cssText='max-width:1100px;margin:12px auto;padding:12px;box-sizing:border-box';panel.open=!!requested;
 const summary=document.createElement('summary');summary.textContent=requested?'Link your Bingo card to HQ':'Bingo results for your recording';panel.append(summary);
 const info=document.createElement('p');info.textContent=requested?'Choose your card for '+target.title+'. Link it to show marked squares and completed Bingo lines in Record.':'Export a results file to attach your card to the same movie in HQ Record.';panel.append(info);
 const label=document.createElement('label');label.textContent='Your saved Bingo card ';select=document.createElement('select');select.setAttribute('aria-label','Card to link to HQ');select.style.cssText='max-width:100%;padding:10px';select.onchange=()=>{selected=select.value};label.append(select);panel.append(label);
 const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:10px';
 if(requested)actions.append(button('Link selected card to HQ',()=>{linked=select.value;last='';send()}),button('Stop sharing updates',()=>{linked='';last='';status.textContent='Sharing stopped. HQ keeps its last imported snapshot.'}));
 actions.append(button('Download card results',()=>{const card=rows.find(c=>c.id===select.value);if(!card)return;const blob=new Blob([JSON.stringify(card,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='bingo-results-'+card.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}));panel.append(actions);
 status=document.createElement('p');status.setAttribute('role','status');panel.append(status);document.body.insertBefore(panel,document.getElementById('root'));update();
}
function update(){
 try{rows=snapshots(localStorage)}catch{rows=[]}
 if(requested&&target.title)rows=rows.filter(c=>sameMovie(c.movie,target));
 const signature=JSON.stringify(rows.map(c=>[c.id,c.name,c.marked,c.revision]));
 if(select.dataset.signature!==signature){const old=selected||select.value;select.replaceChildren();for(const card of rows){const option=document.createElement('option'),s=summarizeResults(card);option.value=card.id;option.textContent=card.name+' · '+card.movie.title+' · '+s.markedCount+' marked / '+s.lines.length+' Bingos';select.append(option)}if(rows.some(c=>c.id===old))select.value=old;selected=select.value;select.dataset.signature=signature;}
 if(!rows.length)status.textContent=requested?'No saved card for this movie on this browser yet. Start or resume the matching game below, then link it.':'Your current individual card and saved shared cards will appear here.';
 if(linked)send();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
setInterval(()=>{if(panel)update()},1200);
window.addEventListener('storage',update);
