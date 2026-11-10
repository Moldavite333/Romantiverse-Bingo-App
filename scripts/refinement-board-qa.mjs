import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
import {displayLabel} from '../src/engine/displayLabel.mjs';
const entries=JSON.parse(await readFile('src/art/illustrations.json','utf8'));
const active=entries.filter(e=>e.active&&e.id!=='free'),root=resolve('dist'),out=process.argv.find(arg=>arg.startsWith('--out='))?.slice('--out='.length)||'artifacts/refinement/boards';
const allMarked=process.argv.includes('--all-marked');
const dpr=Number(process.argv.find(a=>a.startsWith('--dpr='))?.split('=')[1]||1);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.json':'application/json'};
const server=createServer(async(req,res)=>{try{
 const path=resolve(root,'.'+(new URL(req.url,'http://local').pathname==='/'?'/index.html':new URL(req.url,'http://local').pathname));
 if(!path.startsWith(root+sep))throw Error('Outside build');
 res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'}).end(await readFile(path));
}catch{res.writeHead(404).end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=process.argv.find(x=>x.startsWith('https://'))||`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({headless:true});
await mkdir(out,{recursive:true});
const results=[];
try{
 for(const width of [320,360,390,430,1440]){
  const covered=new Set();
  for(let offset=0;offset<active.length;offset+=24){
   const batch=active.slice(offset,offset+24);
   for(const e of active)if(batch.length<24&&!batch.some(t=>t.id===e.id))batch.push(e);
   const card=batch.map(e=>({id:e.id,label:e.label,category:'cheese'}));
   card.splice(12,0,{id:'free',label:'CHEESE LOUISE POD',category:'free'});
   const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:dpr,serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://*.supabase.co/**',r=>r.fulfill({json:[]}));
   await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('https://fonts.gstatic.com/**',r=>r.abort());
   await page.addInitScript(game=>{localStorage.setItem('romantiverse-v2',JSON.stringify(game));sessionStorage.setItem('romantiverse-last-tab','play')},{movie:{id:'refinement-inventory',title:'Illustration inventory',season:'Christmas'},card,free:true,mode:'classic',marked:[12],completed:false,startedAt:'2026-11-07T12:00:00Z'});
   await page.goto(origin,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelectorAll('.board .square-art').length===25&&[...document.querySelectorAll('.board .square-art')].every(i=>i.complete&&i.naturalWidth));
   await page.locator('.board .square-art').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
   if(dpr>=2)assert.ok(await page.locator('.board .square-art').evaluateAll(images=>images.every(i=>i.dataset.illustrationId==='free'||i.currentSrc.includes('/illustrations/detail/'))),'High-density display must select the original-source detail exports');
   const prefix=`${out}/${width}-batch-${offset/24+1}`;
   await page.locator('.board').screenshot({animations:'disabled',path:prefix+'-unselected.png'});
   const geometry=await page.locator('.board .square').evaluateAll(squares=>squares.map(s=>{
    const img=s.querySelector('img'),label=s.querySelector('.square-label'),a=img.getBoundingClientRect(),b=label.getBoundingClientRect(),c=s.getBoundingClientRect();
    return {id:img.dataset.illustrationId,imageWidth:a.width,imageHeight:a.height,labelHeight:b.height,ratio:a.height/(a.height+b.height),overlap:a.bottom>b.top+.5,clipped:s.scrollHeight>s.clientHeight+1||label.scrollHeight>label.clientHeight+1||label.scrollWidth>label.clientWidth+1,canonical:s.getAttribute('aria-label'),visible:label.innerText,filter:getComputedStyle(img).filter,squareWidth:c.width};
   }));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`Overflow at ${width}`);
   assert.deepEqual(errors,[]);
   for(const g of geometry){
    assert.equal(g.clipped,false,`${width}: clipped ${JSON.stringify(g)}`);
    assert.equal(g.overlap,false,`${width}: overlap ${g.id}`);
    assert.equal(g.filter,'none');
    if(width<=600)assert.ok(Math.abs(g.ratio-.7)<.015,`${width}: ratio ${JSON.stringify(g)}`);
    const e=entries.find(e=>e.id===g.id);assert.ok(g.canonical.includes(displayLabel(e.label)),`Display name missing ${g.id}`);
    covered.add(g.id);
   }
   await page.locator('.board .square').nth(0).click();
   assert.equal(await page.locator('.board .square').nth(0).getAttribute('aria-pressed'),'true');
   await page.locator('.board').screenshot({animations:'disabled',path:prefix+'-selected.png'});
   for(const i of [1,2,3,4])await page.locator('.board .square').nth(i).click();
   assert.equal(await page.locator('.board .in-line').count(),5);
   await page.getByRole('button',{name:'Keep Playing',exact:true}).click();
   await page.locator('.board').screenshot({animations:'disabled',path:prefix+'-winning.png'});
   assert.equal(await page.locator('.board .square').nth(12).isDisabled(),true);
   if(allMarked){
    for(let i=0;i<25;i++)if(await page.locator('.board .square').nth(i).getAttribute('aria-pressed')!=='true')await page.locator('.board .square').nth(i).click();
    assert.equal(await page.locator('.board .square.marked').count(),25);
    assert.ok(await page.locator('.board .square-art').evaluateAll(images=>images.every(e=>e.complete&&e.naturalWidth===384&&getComputedStyle(e).filter==='none')));
    await page.locator('.board').screenshot({animations:'disabled',path:prefix+'-all-marked.png'});
   }
   results.push({width,batch:offset/24+1,geometry,allMarked});await context.close();
  }
  assert.equal(covered.size,active.length+1,`${width}: incomplete asset coverage`);
  console.log(`${width}: all ${active.length} active tropes + center; unselected, selected and winning passed`);
 }
 await writeFile(`${out}/report.json`,JSON.stringify({origin,dpr,activeTropes:active.length,missing:0,viewports:5,boards:results.length,statesPerBoard:allMarked?4:3,results},null,2)+'\n');
}finally{await browser.close();await new Promise(r=>server.close(r))}
