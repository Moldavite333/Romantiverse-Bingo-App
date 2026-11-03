// Whole-product visual QA: window sizes, navigation, selection and game states.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const root=resolve('dist'),out='artifacts/design';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp'};
const server=createServer(async(req,res)=>{try{
 const path=resolve(root,decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/^\//,'')||'index.html');
 if(!path.startsWith(root+sep))throw Error('Outside build');
 const data=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'});res.end(data);
}catch{res.writeHead(404);res.end()}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{})});
await mkdir(out,{recursive:true});const results=[];
try{
 for(const [width,height] of [[320,844],[390,844],[900,1000],[1440,1000],[1920,1080]]){
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errors.push(r.status()+' '+r.url())});
  await page.route('https://*.supabase.co/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('https://fonts.gstatic.com/**',r=>r.abort());
  await page.route('https://www.wikidata.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"search":[]}'}));
  async function check(name,full=false){
   await page.evaluate(()=>Promise.all([...document.images].filter(i=>i.loading!=='lazy'||i.getBoundingClientRect().top<innerHeight).map(i=>i.decode().catch(()=>{}))));
   const geometry=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
   assert.ok(geometry.scroll<=geometry.width+2,`${name} overflow at ${width}: ${JSON.stringify(geometry)}`);
   await page.screenshot({path:`${out}/${name}-${width}.png`,fullPage:full,animations:'disabled'});
  }
  async function contrast(selector){
   const ratio=await page.locator(selector).first().evaluate(el=>{
    const style=getComputedStyle(el),parse=s=>s.match(/[\d.]+/g).slice(0,3).map(Number);
    const luminance=s=>{const c=parse(s).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};
    const a=luminance(style.color),b=luminance(style.backgroundColor);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
   });assert.ok(ratio>=4.5,`${selector} contrast ${ratio}`);return Number(ratio.toFixed(2));
  }
  await page.goto(origin,{waitUntil:'domcontentloaded'});await page.locator('.movie-card').first().waitFor();await check('discover');
  const primaryContrast=await contrast('.hero .primary');
  await page.getByRole('textbox',{name:'Search movies by title'}).fill('A Biltmore Christmas');
  await page.getByRole('heading',{name:'A Biltmore Christmas',exact:true}).waitFor();
  await page.locator('.movie-library').screenshot({path:`${out}/movie-selection-${width}.png`,animations:'disabled'});
  await page.locator('.game-setup').screenshot({path:`${out}/setup-${width}.png`,animations:'disabled'});
  const modeContrast=await contrast('.mode.chosen');
  await page.getByRole('button',{name:'Play This Movie'}).first().click();
  if(await page.locator('.toast button').count())await page.locator('.toast button').click();
  await page.waitForFunction(()=>{const images=[...document.querySelectorAll('.board .square-art')];return images.length===25&&images.every(i=>i.complete&&i.naturalWidth===384)});
  await check('game',true);
  const squareContrast=await contrast('.square:not(.marked)');
  // The card is the primary play surface at every viewport; secondary controls belong below.
  const playGeometry=await page.locator('.game-layout').evaluate(el=>{
   const board=el.querySelector('.board').getBoundingClientRect();
   const companion=el.querySelector('.game-companion').getBoundingClientRect();
   return {columns:getComputedStyle(el).gridTemplateColumns.trim().split(/\\s+/).length,
    boardWidth:board.width,boardBottom:board.bottom,companionTop:companion.top,
    boardLeft:board.left,boardRight:board.right};
  });
  assert.equal(playGeometry.columns,1,'Playing card owns the primary full-width row');
  assert.ok(playGeometry.companionTop>=playGeometry.boardBottom-2,
   'Companion controls appear below the board');
  assert.ok(playGeometry.boardWidth>=Math.min(width-42,700),
   `Card must stay readable at ${width}px: ${JSON.stringify(playGeometry)}`);
  assert.ok(playGeometry.boardLeft>=0&&playGeometry.boardRight<=width+2,
   'Full Bingo card fits horizontally without clipping');
  await page.locator('.board .square').first().click();
  await page.locator('.game-table').screenshot({path:`${out}/selected-${width}.png`,animations:'disabled'});
  const markedContrast=await contrast('.square.marked:not(.is-free)');
  for(const i of [1,2,3,4])await page.locator('.board .square').nth(i).click();
  assert.equal(await page.locator('.square.in-line').count(),5);
  await page.locator('.game-layout').screenshot({path:`${out}/bingo-${width}.png`,animations:'disabled'});
  const winContrast=await contrast('.square.in-line');
  const unobscured=await page.locator('.square.in-line .square-art').first().evaluate(im=>({filter:getComputedStyle(im).filter,opacity:getComputedStyle(im).opacity}));
  assert.deepEqual(unobscured,{filter:'none',opacity:'1'});
  await page.getByRole('button',{name:'Workshop',exact:true}).click();
  await page.locator('.workshop-tile').first().click();assert.equal(await page.locator('.workshop-tile').first().getAttribute('aria-pressed'),'true');
  await check('workshop',true);assert.equal(await page.locator('.workshop-grid .square-art').count(),25);
  await page.getByRole('button',{name:'Play Together',exact:true}).click();await check('together',true);
  await page.getByRole('button',{name:'How to Play',exact:true}).click();await check('rules',true);
  await page.getByRole('button',{name:'Cheese Tray',exact:true}).click();await check('history',true);
  await page.getByRole('button',{name:'My Card',exact:true}).click();await page.getByRole('button',{name:'Finish & Save Results',exact:true}).click();
  await check('results',true);assert.deepEqual(errors,[]);
  results.push({width,height,checked:['discovery','selection','setup','game','marked','bingo','workshop','multiplayer-setup','rules','history','results'],contrast:{primary:primaryContrast,mode:modeContrast,square:squareContrast,marked:markedContrast,win:winContrast},browserErrors:0});
  console.log(`Whole-game visual and interaction QA passed at ${width}×${height}.`);await context.close();
 }
 await writeFile(`${out}/results.json`,JSON.stringify(results,null,2));
}finally{await browser.close();await new Promise(ok=>server.close(ok))}
