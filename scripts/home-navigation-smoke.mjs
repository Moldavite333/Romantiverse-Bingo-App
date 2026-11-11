import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {preview} from 'vite';
import {mkdir} from 'node:fs/promises';

const server=await preview({preview:{host:'127.0.0.1',port:0}});
const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
const browser=await chromium.launch({headless:true});
await mkdir('artifacts',{recursive:true});
try{
 for(const width of [320,390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.route('https://*.supabase.co/**',r=>r.fulfill({contentType:'application/json',body:'[]'}));
  await page.goto(origin);
  await page.getByRole('button',{name:'Play This Movie',exact:true}).first().click();
  for(const tab of ['Discover','My Card','Workshop','Play Together','Cheese Tray','How to Play']){
   await page.getByRole('button',{name:tab,exact:true}).click();
   await page.evaluate(()=>window.scrollTo(0,0));
   const home=page.getByRole('link',{name:/Home.*Cheese Louise Podcast/});
   assert.equal(await home.count(),1);
   assert.equal(await home.getAttribute('href'),'https://cheeselouisepod.com/');
   const box=await home.boundingBox();
   assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=width&&box.height>=44,`${tab} Home fits at ${width}px`);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),`${tab} overflow at ${width}`);
   await page.keyboard.press('Tab');
   await home.focus();
   assert.ok(await home.evaluate(e=>e.matches(':focus-visible')));
   if(['Discover','My Card','Play Together'].includes(tab))await page.screenshot({path:`artifacts/home-${width}-${tab.replaceAll(' ','-')}.png`});
  }
  await page.route('https://cheeselouisepod.com/',r=>r.fulfill({contentType:'text/html',body:'<h1>Cheese Louise homepage</h1>'}));
  await page.getByRole('link',{name:/Home.*Cheese Louise Podcast/}).click();
  await page.waitForURL('https://cheeselouisepod.com/');
  await page.close();
 }
 console.log('Home navigation passed: six views at 320, 390, 768 and 1440px; keyboard focus and same-tab homepage navigation.');
}finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
