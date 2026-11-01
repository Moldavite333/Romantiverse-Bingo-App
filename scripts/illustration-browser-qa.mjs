import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
import {buildCard} from '../src/engine/intelligence.mjs';
const before=process.argv.includes('--before'),live=process.argv.find(x=>x.startsWith('https://'));
const root=resolve('dist'),server=createServer(async(req,res)=>{try{const file=resolve(root,'.'+(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+sep))throw Error('Outside build');res.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.json':'application/json','.svg':'image/svg+xml'}[extname(file)]||'application/octet-stream'}).end(await readFile(file))}catch{res.writeHead(404).end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=live||'http://127.0.0.1:'+server.address().port+'/',browser=await chromium.launch();
await mkdir('artifacts/artwork',{recursive:true});
const results=[];
try{
 for(const theme of ['Christmas','Fall'])for(const width of [320,390,1440]){
  const page=await browser.newPage({viewport:{width,height:1000},serviceWorkers:'block'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://*.supabase.co/**',r=>r.fulfill({json:[]}));
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('https://fonts.gstatic.com/**',r=>r.abort());
  const movie={id:'artwork-review-'+theme,title:'Romantiverse Artwork Review',season:theme,synopsis:''};
  const card=buildCard(movie,{seed:2701,free:true});
  await page.addInitScript(game=>{if(!localStorage.getItem('romantiverse-v2'))localStorage.setItem('romantiverse-v2',JSON.stringify(game));sessionStorage.setItem('romantiverse-last-tab','play')},{movie,card,free:true,mode:'classic',difficulty:'balanced',ratio:50,marked:[12],completed:false,startedAt:'2026-11-01T12:00:00Z'});
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.locator('.board .square').first().waitFor();
  await page.waitForFunction(()=>document.querySelectorAll('.board .square-art').length===25&&[...document.querySelectorAll('.board .square-art')].every(i=>i.complete&&i.naturalWidth>0));
  const prefix=`artifacts/artwork/${before?'before':'after'}-${theme}-${width}`;
  await page.locator('.board').screenshot({animations:'disabled',path:prefix+'-unselected.png'});
  assert.deepEqual(errors,[]);assert.equal(await page.locator('[data-missing-illustration]').count(),0);
  const geometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,squares:[...document.querySelectorAll('.board .square')].map(s=>{const label=s.querySelector('.square-label'),img=s.querySelector('img'),a=s.getBoundingClientRect(),b=label.getBoundingClientRect();return {label:label.textContent,clipped:s.scrollHeight>s.clientHeight+1||b.bottom>a.bottom+1||label.scrollWidth>label.clientWidth+1,imageWidth:img.getBoundingClientRect().width,filter:getComputedStyle(img).filter}})}));
  assert.equal(geometry.overflow,false,theme+' page overflow '+width);
  assert.ok(geometry.squares.every(s=>!s.clipped),JSON.stringify(geometry.squares.filter(s=>s.clipped)));
  if(!before){
   assert.equal(new Set(await page.locator('.board img').evaluateAll(imgs=>imgs.map(i=>i.src))).size,25);
   await page.locator('.board .square').nth(0).click();
   assert.equal(await page.locator('.board .square').nth(0).getAttribute('aria-pressed'),'true');
   await page.locator('.board').screenshot({animations:'disabled',path:prefix+'-selected.png'});
   for(const i of [1,2,3,4])await page.locator('.board .square').nth(i).click();
   assert.equal(await page.locator('.board .in-line').count(),5);
   assert.ok(await page.locator('.board img').evaluateAll(imgs=>imgs.every(i=>getComputedStyle(i).filter==='none')),'Marking must not obscure artwork');
   await page.locator('.board').screenshot({animations:'disabled',path:prefix+'-winner.png'});
   await page.screenshot({animations:'disabled',path:prefix+'-page.png',fullPage:true});
   await page.reload();await page.locator('.board .in-line').first().waitFor();
   assert.equal(await page.locator('.board .in-line').count(),5,'Autosave survives reload');
  }
  results.push({theme,width,...geometry});await page.close();
 }
 if(!before){
  const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
  await page.route('https://*.supabase.co/**',r=>r.fulfill({json:[]}));
  await page.route('**/illustrations/meet-cute.webp',r=>r.fulfill({status:404}));
  const movie={id:'broken-art',title:'Artwork error fixture',season:'Christmas'},card=buildCard(movie,{seed:1});card[0]={id:'meet-cute',label:'First meeting',category:'cheese'};
  await page.addInitScript(game=>{localStorage.setItem('romantiverse-v2',JSON.stringify(game));sessionStorage.setItem('romantiverse-last-tab','play')},{movie,card,free:true,mode:'classic',marked:[12]});
  await page.goto(origin);await page.locator('[data-missing-illustration="meet-cute"]').first().waitFor();
  assert.match(await page.locator('[data-missing-illustration="meet-cute"]').first().innerText(),/Illustration unavailable/);await page.close();
 }
 await writeFile(`artifacts/artwork/${before?'before':'after'}-browser-report.json`,JSON.stringify(results,null,2));
 console.log(`${before?'Baseline':'Updated'} artwork: ${results.length} theme/viewport checks passed; selected, winning, autosave and broken-image checks ${before?'deferred':'passed'}`);
}finally{await browser.close();await new Promise(r=>server.close(r))}
