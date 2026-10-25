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
 await page.route('https://*.supabase.co/**',route=>route.fulfill({status:200,contentType:'application/json',body:'{"items":[]}'}));
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
 const unknown=await newPage(390);
 await unknown.page.goto(appUrl,{waitUntil:'domcontentloaded'});
 await unknown.page.getByLabel('Search movies by title').fill('Winter Wedding');
 const result=unknown.page.locator('.movie-card').filter({hasText:'The Winter Wedding'});
 await result.waitFor();
 assert.match(await result.innerText(),/SEASON UNVERIFIED/,'Public search must not invent a Christmas season');
 await unknown.page.getByLabel('Card theme for movies with no verified season').selectOption('Fall');
 await result.getByRole('button',{name:'Play This Movie'}).click();
 assert.match(await unknown.page.locator('.play-heading').innerText(),/FALL/,'Unclassified title should use the player's selected theme');
 assert.equal(await unknown.page.locator('.board .square').count(),25);
 assert.deepEqual(unknown.errors,[],'Unclassified movie caused browser errors');
 console.log('Unclassified movie search retained the title and respected the chosen card theme.');
 await unknown.context.close();
}finally{
 await browser.close();
 await new Promise(ok=>server.close(ok));
}
