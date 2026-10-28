import test from 'node:test';
import assert from 'node:assert/strict';
import {auditPosterCoverage} from '../scripts/verify-poster-coverage.mjs';

const now = Date.parse('2026-10-28T21:00:00Z');
const movie = (title, year) => ({title, release_year: year, is_demo: false});
const catalog = (...movies) => ({version: 1, movies});
const checked = (title, year, has_poster, checked_at = '2026-10-28T20:00:00Z') =>
  ({title, release_year: year, has_poster, checked_at});
const poster = (title, year) =>
  ({title, release_year: year, poster_url: 'https://image.tmdb.org/t/p/w500/verified.jpg'});
const feed = (count, checks, movies = []) => ({version: 1, catalog_count: count, checks, movies});

test('checked but unmatchable titles retain artwork fallback without failing coverage', () => {
  const report = auditPosterCoverage(
    catalog(movie('A Hallmark Film', 2025), movie('No Artwork', 2026)),
    feed(2, [checked('A Hallmark Film', 2025, true), checked('No Artwork', 2026, false)],
      [poster('A Hallmark Film', 2025)]), now);
  assert.equal(report.healthy, true);
  assert.equal(report.posters.length, 1);
  assert.deepEqual(report.unmatched, ['No Artwork']);
});

test('catalog growth without new checks fails until resolver processes additions', () => {
  const report = auditPosterCoverage(
    catalog(movie('Existing', 2025), movie('New Movie', 2026)),
    feed(2, [checked('Existing', 2025, true)], [poster('Existing', 2025)]), now);
  assert.equal(report.healthy, false);
  assert.deepEqual(report.unprocessed, ['New Movie']);
});

test('stale unmatched titles are retried; recent no-match is legitimate', () => {
  const report = auditPosterCoverage(
    catalog(movie('No Poster', 2025)),
    feed(1, [checked('No Poster', 2025, false, '2026-10-26T00:00:00Z')]), now);
  assert.equal(report.healthy, false);
  assert.deepEqual(report.stale, ['No Poster']);
});

test('catalog audit cannot hide an out-of-date or incomplete source snapshot', () => {
  assert.throws(() => auditPosterCoverage(
    catalog(movie('First', 2025), movie('Second', 2026)),
    feed(1, [checked('First', 2025, false)]), now), /count disagree/);
});

test('never accept a fake image host or inconsistent match status', () => {
  assert.throws(() => auditPosterCoverage(
    catalog(movie('First', 2025)),
    feed(1, [checked('First', 2025, true)],
      [{...poster('First', 2025), poster_url: 'https://example.com/wrong.jpg'}]), now),
    /Unapproved/);
  assert.throws(() => auditPosterCoverage(
    catalog(movie('First', 2025)),
    feed(1, [checked('First', 2025, true)]), now),
    /disagree/);
});

test('case and Unicode normalized titles match the public cache', () => {
  const report = auditPosterCoverage(
    catalog(movie('  Café   Noël ', 2025)),
    feed(1, [checked('CAFÉ NOËL', 2025, true)], [poster('café noël', 2025)]), now);
  assert.equal(report.healthy, true);
});
