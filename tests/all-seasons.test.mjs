import {weightedMoments} from '../supabase/functions/_shared/commonMoments.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {analyzeMovie,buildCard,inferSeason,balance,visibleTropeKey} from '../src/engine/intelligence.mjs';
import {resolveCardTheme,themeLabel} from '../src/engine/launchCollections.mjs';
import {encodeInvitation,parseInvitation} from '../src/engine/invitations.mjs';
import {roomInviteMessage} from '../src/engine/shareRoomInvite.mjs';
test('No Season is explicit and unclassified movies never default to Christmas',()=>{
 assert.equal(inferSeason({title:'A Love Story'}),'Romance');
 assert.equal(inferSeason({title:'Christmas in July',season:'Romance'}),'Romance');
 assert.equal(resolveCardTheme({season:'Unspecified'}),'Romance');
 assert.equal(resolveCardTheme({season:'Christmas'},'Romance'),'Romance');
 assert.equal(themeLabel('Romance'),'No Season');
 assert.equal(resolveCardTheme({season:'Summer'}),'Summer');
});
test('all new themes deal deterministic distinct cards across ratios, difficulty and free-center settings',()=>{
 for(const season of ['Spring','Summer','Romance'])for(const free of [true,false])for(const difficulty of ['easy','balanced','hard'])for(const cheeseRatio of [0,.5,1])for(let seed=0;seed<12;seed++){
  const settings={seed,free,difficulty,cheeseRatio},movie={title:'A Movie Night',season};
  const card=buildCard(movie,settings);assert.equal(card.length,25);assert.equal(new Set(card.map(visibleTropeKey)).size,25);
  assert.deepEqual(card,buildCard(movie,settings));assert.equal(card.filter(t=>t.category==='free').length,free?1:0);
  if(season==='Romance')assert.equal(balance(card).seasonal,0);
  else assert.equal(balance(card).seasonal,(free?24:25)-Math.round((free?24:25)*cheeseRatio));
  for(const t of card)assert.ok(t.category==='free'||t.id.startsWith('room-')||t.id.startsWith('season-'+season+'-'));
 }
 assert.equal(analyzeMovie({season:'Romance'}).seasonal.length,0);
});
test('chosen season survives invitations independently of catalog classification',()=>{
 for(const cardTheme of ['Spring','Summer','Romance']){
  const game={movie:{title:'Catalog Christmas Movie',season:'Christmas'},cardTheme,free:true,mode:'classic',difficulty:'balanced',ratio:50};
  assert.deepEqual(parseInvitation('#invite='+encodeInvitation(game)),game);
  assert.match(roomInviteMessage('https://example.com/?room=ABCDEFG','A Movie','Unspecified',cardTheme),new RegExp('Bingo theme: '+themeLabel(cardTheme)));
 }
});
test('shared games support new themes with independent cards and no seasonal squares for No Season',()=>{
 const source=readFileSync('supabase/functions/game-room/index.ts','utf8');
 const context={weightedMoments,Deno:{env:{get:()=>''},serve:()=>{}},crypto:globalThis.crypto,URL,Request,Response,TextEncoder,Uint8Array,Uint32Array};
 vm.runInNewContext(source.replace(/^import .*;\r?\n/,'')+'\nglobalThis.deal=card;globalThis.supports=isLaunchRoom;',context);
 for(const season of ['Spring','Summer','Romance']){
  assert.equal(context.supports(season,'Unspecified'),true);
  const a=context.deal(season),b=context.deal(season,[a]);assert.equal(a.length,25);assert.equal(new Set(a.map(visibleTropeKey)).size,25);assert.notDeepEqual(a,b);
  if(season==='Romance')assert.ok(a.every(t=>t.category!=='seasonal'));
 }
 assert.equal(context.supports('Horror','Horror'),false);
});
