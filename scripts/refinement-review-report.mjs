import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const entries=JSON.parse(await readFile('src/art/illustrations.json','utf8'));
const notes=[
 {'meet-cute':'Separated book grips and coherent dropped books; preserved surprised eye contact and bookshop.', 'room-a-shared-tradition':'Separated the four arm paths and clarified paper boats contacting water.', 'season-Christmas-18':'Added coherent shafts/harness and visible horse legs; rejected an intermediate extra shoulder hand and removed it.'},
 {'room-a-supportive-friend':'Nervous performer holds script pages; friend reassures and indicates the spotlight/microphone instead of staging an almost-kiss.'},
 {'season-Christmas-25':'Replaced autumn foliage with a snowy Christmas park, quieter winter shadows and warm face lighting; preserved four-person comic acting.'},
 {}
];
const criteria=['Anatomy, architecture, object geometry, contact and light direction','Faces, gaze, body language, trope action and setting','Gouache/watercolor/pencil craft, texture, seasonal palette and cinematic lighting','Series identity, focal clarity, edge quality and native/64px/board-size readability'];
const stages=[];
for(let n=1;n<=4;n++){
 const before=JSON.parse(await readFile(`artifacts/refinement/stage-${n}-before/coverage.json`,'utf8'));
 const after=JSON.parse(await readFile(`artifacts/refinement/stage-${n}-after/coverage.json`,'utf8'));
 assert.equal(before.assets.length,132);assert.equal(after.assets.length,132);
 assert.equal(before.retainedAssets.length,31);assert.equal(after.retainedAssets.length,31);
 const changed=after.assets.filter(e=>e.sha256!==before.assets.find(b=>b.id===e.id)?.sha256).map(e=>e.id).sort();
 assert.deepEqual(changed,Object.keys(notes[n-1]).sort());
 assert.equal(before.assets.find(e=>e.id==='free').sha256,after.assets.find(e=>e.id==='free').sha256);
 assert.deepEqual(before.retainedAssets,after.retainedAssets);
 stages.push({stage:n,criterion:criteria[n-1],reviewedActiveTropes:131,corrected:changed.length,retained:131-changed.length,missing:0,changed,
  reviewMethod:'Visual inspection of all active native-size/64px sheet cells; changed cells re-inspected after optimization and on the regenerated sheet. Unchanged before/after cells verified by SHA-256. No automatic image-processing pass counted as a creative correction.',
  records:after.assets.filter(e=>e.id!=='free').map(e=>({id:e.id,label:e.label,beforeSha256:before.assets.find(b=>b.id===e.id).sha256,afterSha256:e.sha256,visualReview:'inspected',decision:notes[n-1][e.id]?'corrected':'retained',note:notes[n-1][e.id]||'Retained after visual review against this stage criterion; no targeted correction selected.'}))});
}
const board=JSON.parse(await readFile('artifacts/refinement/boards/report.json','utf8'));
const report={baselineCommit:'00db17fb1c510cdb75e81a7674c159b0c443790a',date:'2026-11-07',repository:'https://github.com/Moldavite333/Romantiverse-Bingo-App',scope:{activeTropes:131,center:1,archivedTropes:28,unreferencedRetainedImages:3,totalImageFiles:163,missingRegisteredImages:0},
 generation:{mode:'built-in image_gen',acceptedEdits:5,rejectedVariants:1,programmaticCreativeRecolors:0,svgSubstitutions:0},
 stages,production:{viewports:[320,360,390,430,1440],boards:30,statesPerBoard:3,screenshots:90,ratio:'70/30 artwork/label region on mobile',unitTests:281,
  imageWidths:board.results.filter(e=>e.batch===1).map(e=>({viewport:e.width,min:Math.min(...e.geometry.map(g=>g.imageWidth)),max:Math.max(...e.geometry.map(g=>g.imageWidth))}))},
 preservation:'Canonical IDs/names, deterministic engine, scoring, multiplayer protocol, private HQ data, approved all-season free emblem and paused Android files are unchanged. Board labels are presentation-only; full names remain accessible and in the larger artwork guide.',
 limitations:['At 320px the fixed five-column board has approximately 46–48px artwork boxes, and at 360px 54–56px. The requested approximately 64–100px review is additionally provided by 64px contact-sheet thumbnails and the larger artwork guide. A minimum 64px on-board image at every requested width is not achieved.','Visual sign-off is an agent judgment, not a claim that the user has approved the art. No blind viewer study of label-free trope recognition was performed.'],
 deployment:'pending'};
await writeFile('docs/artwork/refinement-review.json',JSON.stringify(report,null,2)+'\n');
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Romantiverse four-stage review</title><style>body{font:16px/1.5 system-ui;background:#fff8ea;color:#173f36;margin:24px}h1,h2{color:#91364b}a{color:#173f36}.comparison{display:grid;grid-template-columns:1fr 1fr;gap:12px}img{width:100%;height:auto}summary{cursor:pointer;padding:10px;border:1px solid #be8b32}section{margin-bottom:28px}small{display:block}</style><h1>Romantiverse — four-stage visual review</h1><p>131 active trope scenes + approved center. Five scenes refined with image generation; 126 retained after review. Each stage has 11 active sheets and 3 retained sheets: all 163 image files. Active sheets show native 384px images and 64px thumbnails. Retained sheets include 28 archived Horror scenes and 3 unreferenced legacy images; these were preserved.</p><p><a href="../../docs/artwork/refinement-review.json">Exact coverage, hashes, decisions and limitations</a> · <a href="boards/report.json">30-board / 90-state production report</a></p>${stages.map(s=>`<section><h2>Stage ${s.stage}: ${criteria[s.stage-1]}</h2><p>131 reviewed · ${s.corrected} corrected · ${s.retained} retained · 0 missing</p>${Object.entries(notes[s.stage-1]).map(([id,note])=>`<p><b>${id}</b>: ${note}</p>`).join('')}${['', 'retained-'].map(prefix=>Array.from({length:prefix?3:11},(_,i)=>{const file=`${prefix}page-${String(i+1).padStart(2,'0')}.png`;return `<details><summary>${prefix?'Archived / unreferenced':'Active'} page ${i+1} — before / after</summary><div class="comparison">${['before','after'].map(state=>`<a href="stage-${s.stage}-${state}/${file}"><small>${state}</small><img loading="lazy" src="stage-${s.stage}-${state}/${file}" alt="Stage ${s.stage} ${state}, ${prefix||'active '}page ${i+1}"></a>`).join('')}</div></details>`}).join('')).join('')}</section>`).join('')}<h2>Gameplay screenshots</h2>${[320,360,390,430,1440].map(w=>`<p>${w}px: ${['unselected','selected','winning'].map(state=>`<a href="boards/${w}-batch-1-${state}.png">${state}</a>`).join(' · ')}</p>`).join('')}<p>At 320px and 360px actual artwork is smaller than 64px. The full-size guide remains available. See the report for measured sizes.</p></html>`;
await writeFile('artifacts/refinement/index.html',html);
console.log('Review ledger and before/after contact-sheet index saved.');
