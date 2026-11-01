import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateStaticMovies} from '../src/services/staticCatalog.js';
import {matchesMovieQuery} from '../src/engine/movieListings.mjs';

const catalog=validateStaticMovies(JSON.parse(readFileSync(new URL('../public/catalog/movies.json',import.meta.url),'utf8')));
const movie=title=>{
 const result=catalog.find(m=>m.title===title);
 assert.ok(result,'Missing source-backed catalog example: '+title);
 return result;
};

test('Bingo discovery finds source-verified networks and producers',()=>{
 assert.equal(matchesMovieQuery(movie('A Biltmore Christmas'),'Hallmark Channel 2023'),true);
 assert.equal(matchesMovieQuery(movie('A Carpenter Christmas Romance'),'Lifetime'),true);
 assert.equal(matchesMovieQuery(movie("Leah's Perfect Gift"),'MarVista'),true);
 assert.equal(matchesMovieQuery(movie('Peppermint and Postcards'),'Reel One'),true);
 assert.equal(matchesMovieQuery(movie('A Biltmore Christmas'),'Lifetime'),false);
});

test('unverified, unsourced and unapproved studio claims cannot influence discovery',()=>{
 const unverified=movie("A Beautiful Place to Die: A Martha's Vineyard Mystery");
 assert.equal(unverified.verification_status,'unverified');
 assert.equal(matchesMovieQuery(unverified,'Hallmark Mystery'),false);
 const verified=movie('A Biltmore Christmas');
 assert.equal(matchesMovieQuery({...verified,source_url:undefined},'Hallmark Channel'),false);
 assert.equal(matchesMovieQuery({...verified,verification_status:'unverified'},'Hallmark Channel'),false);
 assert.equal(matchesMovieQuery({...verified,network:'Unapproved Network'},'Unapproved Network'),false);
});

test('search never indexes private notes and retains title/year matching',()=>{
 const verified=movie('A Biltmore Christmas');
 const withPrivate={...verified,private_notes:'SECRET_INTERNAL_MARKER',hq_notes:'PRIVATE_WORKSPACE_MARKER'};
 assert.equal(matchesMovieQuery(withPrivate,'SECRET_INTERNAL_MARKER'),false);
 assert.equal(matchesMovieQuery(withPrivate,'PRIVATE_WORKSPACE_MARKER'),false);
 assert.equal(matchesMovieQuery(withPrivate,'2023 biltmore'),true);
 assert.equal(matchesMovieQuery(withPrivate,'2024 biltmore'),false);
});
