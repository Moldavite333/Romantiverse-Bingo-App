import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';

const root=resolve('dist');
const base='/Romantiverse-Bingo-App/';
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!pathname.startsWith(base))throw Error('Outside application');
  const relative=pathname.slice(base.length)||'index.html';
  const file=resolve(root,relative);
  if(!file.startsWith(root+sep)&&file!==resolve(root,'index.html'))throw Error('Outside build');
  const bytes=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const appUrl=origin+base;
const browser=await chromium.launch({headless:true});
await mkdir('artifacts',{recursive:true});
async function newPage(width){
 const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{
  if(response.url().startsWith(origin)&&response.status()>=400)errors.push(response.status()+' '+response.url());
 });
 // External catalog data is independently tested; browser QA must be deterministic.
 await page.route('https://*.supabase.co/**',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
 await page.route('https://www.wikidata.org/w/api.php**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({search:[{id:'Q990001',label:'The Winter Wedding',description:'2025 television film'}]})}));
 await page.route('https://fonts.googleapis.com/**',route=>route.abort());
 await page.route('https://fonts.gstatic.com/**',route=>route.abort());
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'share',{configurable:true,value:async payload=>{
   window.__testShares=(window.__testShares||[]).concat([payload]);
  }});
 });
 return {page,context,errors};
}
try{
 let invitation;
 let originalSquares;
 for(const width of [320,390,1440]){
  const {page,context,errors}=await newPage(width);
  await page.goto(appUrl,{waitUntil:'domcontentloaded'});
  await page.locator('.movie-card').first().waitFor();
  assert.equal(await page.locator('.brand').innerText(),'Brought to you by Cheese Louise Podcast');
  assert.ok(await page.getByRole('button',{name:'Play This Movie'}).count()>0,'Bundled movie catalog must work without network');
  await page.getByRole('button',{name:'Play This Movie'}).first().click();
  const squares=page.locator('.board .square');
  assert.equal(await squares.count(),25,'Expected complete 5×5 Bingo card');
  await page.waitForFunction(()=>[...document.querySelectorAll('.board .square-art')].length===25&&[...document.querySelectorAll('.board .square-art')].every(img=>img.complete&&img.naturalWidth>0));
  const dimensions=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
  assert.ok(dimensions.document<=dimensions.viewport+2,'Horizontal overflow at '+width+'px: '+JSON.stringify(dimensions));
  assert.deepEqual(errors,[],'Unexpected browser errors at '+width+'px');
  await page.screenshot({path:'artifacts/bingo-'+width+'.png',fullPage:true});
  if(width===390){
   originalSquares=await squares.allTextContents();
   await page.getByRole('button',{name:/Share Card/}).click();
   await page.getByRole('button',{name:/Share Card/}).click();
   await page.waitForFunction(()=>window.__testShares?.length===2);
   const links=await page.evaluate(()=>window.__testShares.map(x=>x.url));
   assert.notEqual(links[0],links[1],'Every direct invitation must be unique');
   for(const link of links){
    const url=new URL(link);
    assert.equal(url.origin,origin);
    assert.ok(url.hash.startsWith('#invite='));
    const payload=JSON.parse(Buffer.from(url.hash.slice(8),'base64url').toString('utf8'));
    assert.equal(payload.v,3);
    assert.equal(typeof payload.invite_id,'string');
    for(const forbidden of ['card','marked','token','session','player_id'])assert.equal(forbidden in payload,false,'Invitation leaked '+forbidden);
   }
   // Mobile share sheets and clipboard permissions can both fail. Keep a copyable link.
   await page.evaluate(()=>{
    Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw Error('Share blocked')}});
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('Clipboard blocked')}}});
   });
   await page.getByRole('button',{name:/Share Card/}).click();
   const manual=page.getByRole('textbox',{name:'Direct game invitation link'});
   await manual.waitFor();
   const fallback=await manual.inputValue();
   assert.ok(fallback.startsWith(appUrl+'#invite='),'Manual link must point directly to this game');
   assert.notEqual(fallback,links[0],'Each share attempt must get a new invitation');
   assert.notEqual(fallback,links[1],'Fallback invitation must also be unique');
   assert.match(await page.locator('.toast').innerText(),/Select and copy your invitation link/);
   await page.getByRole('button',{name:'Copy Link'}).click();
   assert.match(await page.locator('.toast').innerText(),/Select and copy your invitation link/);
   invitation=links[0];
  }
  console.log('Bingo browser QA passed at '+width+'px.');
  await context.close();
 }
 const {page,context,errors}=await newPage(390);
 await page.goto(invitation,{waitUntil:'domcontentloaded'});
 await page.locator('.board .square').first().waitFor();
 const guestSquares=await page.locator('.board .square').allTextContents();
 assert.equal(guestSquares.length,25);
 assert.notDeepEqual(guestSquares,originalSquares,'Invitation recipient must receive a newly randomized card');
 assert.deepEqual(errors,[],'Guest invitation caused browser errors');
 console.log('Unique direct-link invitation opened independently with a fresh illustrated card.');
 await context.close();
 // A scheduled Hallmark catalog update may contain a real title whose season is unknown.
 // Keep it searchable without silently calling it Christmas.
 const staticUnknown=await newPage(390);
 await staticUnknown.page.route(appUrl+'catalog/movies.json',async route=>{
  const catalog=JSON.parse(await readFile(resolve(root,'catalog/movies.json'),'utf8'));
  catalog.movies.push({id:'test-hallmark-unclassified',title:'A Winter Wedding',season:'Unspecified',release_year:2026,
   story_facts:{setting:[],relationship:[],conflict:[],event:[]},verification_status:'unverified',is_demo:false});
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(catalog)});
 });
 await staticUnknown.page.goto(appUrl,{waitUntil:'domcontentloaded'});
 const bundledUnknown=staticUnknown.page.locator('.movie-card').filter({hasText:'A Winter Wedding'});
 await bundledUnknown.waitFor();
 assert.match(await bundledUnknown.innerText(),/SEASON UNVERIFIED/,'Bundled unknown-season film must be searchable without inventing a season');
 await staticUnknown.page.getByLabel('Card theme for movies with no verified season').selectOption('Fall');
 await bundledUnknown.getByRole('button',{name:'Play This Movie'}).click();
 assert.match(await staticUnknown.page.locator('.play-heading').innerText(),/FALL CARD.*MOVIE SEASON UNVERIFIED/);
 assert.equal(await staticUnknown.page.locator('.board .square').count(),25);
 assert.deepEqual(staticUnknown.errors,[],'Bundled unknown-season film caused browser errors');
 await staticUnknown.context.close();
 console.log('Automated catalog films with unknown season remain playable without fabricated metadata.');
 // Licensed poster metadata is opt-in. A bare image URL must never publish an
 // unapproved poster, and failed image requests must restore season artwork.
 const posterCheck=await newPage(390);
 await posterCheck.page.route(appUrl+'catalog/movies.json',async route=>{
  const catalog=JSON.parse(await readFile(resolve(root,'catalog/movies.json'),'utf8'));
  const common={season:'Fall',release_year:2026,story_facts:{setting:[],relationship:[],conflict:[],event:[]},is_demo:false};
  catalog.movies.push(
   {...common,id:'test-approved-poster',title:'Poster Preview',poster_url:'https://image.tmdb.org/t/p/w500/approved.jpg',poster_rights:{status:'approved',credit:'Rights cleared · sample art'}},
   {...common,id:'test-unapproved-poster',title:'Unapproved Poster Preview',poster_url:'https://image.tmdb.org/t/p/w500/unapproved.jpg'},
   {...common,id:'test-broken-poster',title:'Broken Poster Preview',poster_url:'https://image.tmdb.org/t/p/w500/broken.jpg',poster_rights:{status:'approved',credit:'Rights cleared · sample art'}}
  );
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(catalog)});
 });
 await posterCheck.page.route('https://image.tmdb.org/t/p/w500/approved.jpg',route=>route.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="120" height="180"><rect width="120" height="180" fill="navy"/></svg>'}));
 await posterCheck.page.route('https://image.tmdb.org/t/p/w500/broken.jpg',route=>route.fulfill({status:404,body:'Not found'}));
 await posterCheck.page.goto(appUrl,{waitUntil:'domcontentloaded'});
 const approvedCard=posterCheck.page.locator('.movie-card').filter({has:posterCheck.page.getByRole('heading',{name:'Poster Preview',exact:true})});
 await approvedCard.waitFor();
 const approvedImage=approvedCard.getByRole('img',{name:'Poster Preview movie poster'});
 await approvedImage.scrollIntoViewIfNeeded();
 await posterCheck.page.waitForFunction(()=>{const img=document.querySelector('img[alt="Poster Preview movie poster"]');return img?.complete&&img.naturalWidth>0});
 assert.match(await approvedCard.innerText(),/Rights cleared · sample art/);
 assert.match(await approvedCard.innerText(),/2026/,'Catalog card shows release year');
 const unapprovedCard=posterCheck.page.locator('.movie-card').filter({has:posterCheck.page.getByRole('heading',{name:'Unapproved Poster Preview',exact:true})});
 assert.equal(await unapprovedCard.locator('.movie-poster').count(),0,'Unapproved poster URLs must never be rendered');
 const brokenCard=posterCheck.page.locator('.movie-card').filter({has:posterCheck.page.getByRole('heading',{name:'Broken Poster Preview',exact:true})});
 await brokenCard.scrollIntoViewIfNeeded(); // The failed image may already be hidden.
 await posterCheck.page.waitForFunction(()=>document.querySelector('img[alt="Broken Poster Preview movie poster"]')?.hidden===true);
 assert.equal(await brokenCard.locator('.poster-credit').isVisible(),false,'Failed poster must fall back to illustrated season art');
 await approvedCard.getByRole('button',{name:'Add Poster Preview to favorites'}).click();
 assert.equal(await approvedCard.getByRole('button',{name:'Remove Poster Preview from favorites'}).count(),1);
 assert.deepEqual(posterCheck.errors,[],'Poster catalog caused browser errors');
 await posterCheck.context.close();
 console.log('Rights-cleared posters, fallback art, release years and specific favorite labels passed browser QA.');
 const unknown=await newPage(390);
 await unknown.page.goto(appUrl,{waitUntil:'domcontentloaded'});
 await unknown.page.getByLabel('Search movies by title').fill('Winter Wedding');
 const result=unknown.page.locator('.movie-card').filter({hasText:'The Winter Wedding'});
 await result.waitFor();
 assert.match(await result.innerText(),/SEASON UNVERIFIED/,'Public search must not invent a Christmas season');
 await unknown.page.getByLabel('Card theme for movies with no verified season').selectOption('Fall');
 await result.getByRole('button',{name:'Play This Movie'}).click();
 assert.match(await unknown.page.locator('.play-heading').innerText(),/FALL CARD.*MOVIE SEASON UNVERIFIED/,'Chosen theme must not become verified movie metadata');
 assert.equal(await unknown.page.locator('.board .square').count(),25);
 await unknown.page.getByRole('button',{name:/Share Card/}).click();
 await unknown.page.waitForFunction(()=>window.__testShares?.length===1);
 const unknownLink=await unknown.page.evaluate(()=>window.__testShares[0].url);
 const unknownPayload=JSON.parse(Buffer.from(new URL(unknownLink).hash.slice(8),'base64url').toString('utf8'));
 assert.equal(unknownPayload.movie.season,'Unspecified','Shared movie season must remain unverified');
 assert.equal(unknownPayload.cardTheme,'Fall','Chosen card theme must survive direct invitations');
 const guest=await newPage(390);
 await guest.page.goto(unknownLink,{waitUntil:'domcontentloaded'});
 await guest.page.locator('.board .square').first().waitFor();
 assert.match(await guest.page.locator('.play-heading').innerText(),/FALL CARD.*MOVIE SEASON UNVERIFIED/);
 assert.equal(await guest.page.locator('.board .square').count(),25);
 assert.deepEqual(guest.errors,[],'Unverified-season invitation caused browser errors');
 await guest.context.close();
 assert.deepEqual(unknown.errors,[],'Unclassified movie caused browser errors');
 console.log('Unclassified movie search retained the title and respected the chosen card theme.');
 await unknown.context.close();
 // Custom titles can choose a card theme, but that theme must not be
 // presented as verified metadata about the movie.
 const customCheck=await newPage(390);
 await customCheck.page.goto(appUrl,{waitUntil:'domcontentloaded'});
 await customCheck.page.getByLabel('Search movies by title').fill('A Totally Unlisted Winter Romance');
 const unlisted=customCheck.page.getByRole('button',{name:'Play “A Totally Unlisted Winter Romance”'});
 await unlisted.waitFor();
 await customCheck.page.getByLabel('Card theme for movies with no verified season').selectOption('Fall');
 await unlisted.click();
 assert.match(await customCheck.page.locator('.play-heading').innerText(),/FALL CARD.*MOVIE SEASON UNVERIFIED/);
 await customCheck.page.getByRole('button',{name:/Share Card/}).click();
 await customCheck.page.waitForFunction(()=>window.__testShares?.length===1);
 const customInvite=await customCheck.page.evaluate(()=>window.__testShares[0].url);
 const customPayload=JSON.parse(Buffer.from(new URL(customInvite).hash.slice(8),'base64url').toString('utf8'));
 assert.equal(customPayload.movie.season,'Unspecified');
 assert.equal(customPayload.cardTheme,'Fall');
 await customCheck.page.getByRole('button',{name:'Discover'}).click();
 await customCheck.page.getByLabel('Custom movie title').fill('A Different Unlisted Christmas Movie');
 await customCheck.page.getByLabel('Card theme for custom movie').selectOption('Horror');
 await customCheck.page.getByRole('button',{name:'Create Card'}).click();
 assert.match(await customCheck.page.locator('.play-heading').innerText(),/HORROR CARD.*MOVIE SEASON UNVERIFIED/);
 assert.deepEqual(customCheck.errors,[],'Custom title flows caused browser errors');
 await customCheck.context.close();
 console.log('Uncatalogued search and custom entry preserve unverified movie seasons and chosen card themes.');
}finally{
 await browser.close();
 await new Promise(ok=>server.close(ok));
}
