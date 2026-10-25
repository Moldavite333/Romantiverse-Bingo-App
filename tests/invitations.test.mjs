import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeInvitation,parseInvitation} from '../src/engine/invitations.mjs';
import {buildCard} from '../src/engine/intelligence.mjs';
const game={movie:{title:'Café Noël & the Apple Orchard',season:'Fall'},free:true,mode:'chase',difficulty:'hard',ratio:40};
const legacy=payload=>btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
test('share link preserves exact movie and game settings including Unicode',()=>{
 const decoded=parseInvitation('#invite='+encodeInvitation(game));
 assert.deepEqual(decoded,game);
});
test('legacy shared-card URLs open the movie but never duplicate sender squares',()=>{
 const decoded=parseInvitation('#card='+legacy({v:1,...game,card:Array.from({length:25},(_,i)=>({id:'sender-'+i,label:'Private '+i}))}));
 assert.deepEqual(decoded,game);
 assert.equal('card' in decoded,false);
 const first=buildCard(decoded.movie,{seed:11,free:decoded.free,cheeseRatio:decoded.ratio/100});
 const second=buildCard(decoded.movie,{seed:12,free:decoded.free,cheeseRatio:decoded.ratio/100});
 assert.notDeepEqual(first,second);
});
test('malformed, oversized, unsupported and unrelated hashes are rejected',()=>{
 assert.equal(parseInvitation('#discover'),null);
 assert.equal(parseInvitation('#invite=!!!'),null);
 assert.equal(parseInvitation('#invite='+'A'.repeat(3001)),null);
 assert.equal(parseInvitation('#invite='+legacy({v:1,...game})),null);
 assert.equal(parseInvitation('#invite='+legacy({v:2,movie:{title:'x',season:'Mars'}})),null);
 assert.throws(()=>encodeInvitation({movie:{title:'',season:'Fall'}}));
});
