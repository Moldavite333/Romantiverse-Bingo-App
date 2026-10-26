import test from 'node:test';
import assert from 'node:assert/strict';
import {movieScoreKey,bestMovieScores} from '../src/engine/movieScores.mjs';

test('same movie has the same identity across catalogs, card modes, and seasons',()=>{
 assert.equal(movieScoreKey({id:'supabase-12',title:' Coupled   Up for Christmas ',release_year:2023}),
              movieScoreKey({id:'tmdb-55',title:'coupled up for christmas',release_year:2023,season:'Fall'}));
 assert.equal(movieScoreKey({title:'A Christmas Carol',release_year:1984}),'a christmas carol (1984)');
 assert.notEqual(movieScoreKey({title:'A Christmas Carol',release_year:1984}),movieScoreKey({title:'A Christmas Carol',release_year:1999}));
});
test('two different movies watched in the same week both count',()=>{
 const rows=bestMovieScores([{title:'Movie A',lines:2,date:'2026-10-26'},{title:'Movie B',lines:1,date:'2026-10-26'}]);
 assert.equal(rows.length,2);
 assert.equal(rows.reduce((sum,r)=>sum+r.lines*100,0),300);
});
test('replaying a movie later improves its single score and never stacks points',()=>{
 const history=[{title:'Movie A',lines:1,date:'2026-10-05'},{title:' movie   a ',lines:3,date:'2026-10-19'},{title:'Movie A',lines:2,date:'2026-11-02'}];
 const scores=bestMovieScores(history);
 assert.equal(scores.length,1);
 assert.equal(scores[0].lines,3);
 assert.equal(scores.reduce((sum,r)=>sum+r.lines*100,0),300);
 assert.equal(history.length,3,'the private movie-night log remains untouched');
});
test('a later lower score does not replace the earlier best',()=>{
 const scores=bestMovieScores([{title:'Movie A',lines:7,date:'2026-10-01'},{title:'Movie A',lines:0,date:'2026-11-09'}]);
 assert.equal(scores.length,1);
 assert.equal(scores[0].lines,7);
});
