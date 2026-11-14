import assert from 'node:assert/strict';
import {CHEESE} from '../src/engine/intelligence.mjs';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const root=resolve('dist'),out='artifacts/seasons/browser';
const generalIds=new Set(CHEESE.map(t=>t.id));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.json':'application/json'};
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+(new URL(req.url,'http://local').pathname==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!path.startsWith(root+sep))throw Error('Outside build');res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'}).end(await readFile(path))}catch{res.writeHead(404).end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=process.argv.find(x=>x.startsWith('https://'))||`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({headless:true}),results=[];
await mkdir(out,{recursive:true});
try{
 for(const width of [320,360,390,430,1440])for(const theme of ['Spring','Summer','Romance']){
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('https://*.supabase.co/**',r=>r.fulfill({json:[]}));
  await context.route('https://fonts.googleapis.com/**',r=>r.abort());await context.route('https://fonts.gstatic.com/**',r=>r.abort());
  await page.goto(origin);
  const selector=page.getByRole('combobox',{name:'Card theme for custom movie',exact:true});
  assert.deepEqual(await selector.locator('option').allTextContents(),['Auto — match movie, otherwise No Season','No Season','Spring','Summer','Fall','Christmas']);
  await page.getByRole('textbox',{name:'Custom movie title',exact:true}).fill('A Year-Round Love Story');
  await selector.selectOption(theme);
  await page.getByRole('button',{name:'Create Card',exact:true}).click();
  await page.waitForFunction(()=>document.querySelectorAll('.board .square-art').length===25&&[...document.querySelectorAll('.board .square-art')].every(i=>i.complete&&i.naturalWidth===384));
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('romantiverse-v2')));
  assert.equal(saved.cardTheme,theme);assert.equal(saved.movie.season,'Unspecified');
  assert.equal(saved.card.filter(t=>t.category==='seasonal').length,theme==='Romance'?0:8);
  assert.equal(new Set(saved.card.map(t=>t.label)).size,25);
  assert.ok(saved.card.every(t=>t.id==='free'||t.id.startsWith('room-')||t.id.startsWith('season-'+theme+'-')||generalIds.has(t.id)));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  for(const tile of await page.locator('.board .square').all()){
   const label=await tile.evaluate(e=>{const label=e.querySelector('.square-label');return {id:e.querySelector('img').dataset.illustrationId,text:label.innerText,height:label.clientHeight,scroll:label.scrollHeight}});
   assert.ok(label.scroll<=label.height+1,`${width}: ${JSON.stringify(label)}`);
  }
  await page.locator('.game-table').screenshot({path:`${out}/${width}-${theme}-normal.png`,animations:'disabled'});
  await page.getByRole('button',{name:'↗ Share Card',exact:true}).click();
  const invite=await page.getByRole('textbox',{name:'Direct game invitation link',exact:true}).inputValue();
  const guest=await context.newPage();await guest.goto(invite);await guest.locator('.board .square').first().waitFor();
  const shared=await guest.evaluate(()=>JSON.parse(localStorage.getItem('romantiverse-v2')));
  assert.equal(shared.cardTheme,theme);assert.equal(shared.movie.season,'Unspecified');await guest.close();
  for(const i of [0,1,2,3,4])await page.locator('.board .square').nth(i).click();
  await page.getByRole('dialog',{name:'Happily Ever After!',exact:true}).waitFor();
  await page.getByRole('button',{name:'Keep Playing',exact:true}).click();
  await page.locator('.game-table').screenshot({path:`${out}/${width}-${theme}-winning.png`,animations:'disabled'});
  assert.equal(await page.locator('.board .square.in-line').count()>=5,true);
  if(width===1440){await page.getByRole('button',{name:'Full-screen board',exact:true}).click();await page.waitForFunction(()=>Boolean(document.fullscreenElement));await page.screenshot({path:`${out}/1440-${theme}-fullscreen.png`,animations:'disabled'});await page.getByRole('button',{name:'Exit full-screen board',exact:true}).click()}
  await page.reload();await page.locator('.board .square').first().waitFor();
  const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('romantiverse-v2')));assert.equal(restored.cardTheme,theme);assert.deepEqual([...restored.marked].sort((a,b)=>a-b),[0,1,2,3,4,12]);assert.deepEqual(errors,[]);
  results.push({width,theme,cardImages:25,normal:true,winning:true,sharing:true,reload:true,noOverflow:true});await context.close();
 }
 await writeFile(`${out}/report.json`,JSON.stringify({origin,results,boards:results.length,missing:0},null,2)+'\n');
 console.log('All seasons: 15 boards passed theme selection, 25 illustrations, fitting labels, sharing, wins and reload at five sizes; desktop fullscreen reviewed.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
