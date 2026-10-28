import fs from 'node:fs';

export function posterKey(movie) {
  return String(movie.title ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()
    + '|' + String(movie.release_year);
}

export function auditPosterCoverage(catalog, feed, now = Date.now()) {
  if (catalog?.version !== 1 || !Array.isArray(catalog.movies) ||
      feed?.version !== 1 || !Array.isArray(feed.movies) ||
      !Array.isArray(feed.checks)) throw Error('Invalid public poster audit payload');
  const expected = new Map();
  for (const movie of catalog.movies) {
    if (movie.is_demo === true || !Number.isInteger(movie.release_year) ||
        movie.release_year < 1900 || movie.release_year > 2100 ||
        typeof movie.title !== 'string' || !movie.title.trim()) continue;
    expected.set(posterKey(movie), movie);
  }
  if (expected.size === 0 || expected.size !== feed.catalog_count) {
    throw Error('Public catalog and audited source count disagree');
  }
  const checks = new Map();
  for (const row of feed.checks) {
    const key = posterKey(row);
    if (checks.has(key)) throw Error('Duplicate checked poster key: ' + key);
    checks.set(key, row);
  }
  const verified = new Map();
  for (const row of feed.movies) {
    const key = posterKey(row);
    if (verified.has(key)) throw Error('Duplicate verified poster key: ' + key);
    const url = String(row.poster_url ?? '');
    if (!/^https:\/\/image\.tmdb\.org\/t\/p\/(?:w\d+|original)\/[A-Za-z0-9_.-]+$/.test(url)) {
      throw Error('Unapproved public poster URL: ' + key);
    }
    verified.set(key, row);
  }
  const unprocessed = [], stale = [], unmatched = [], posters = [];
  for (const [key, movie] of expected) {
    const check = checks.get(key);
    if (!check) { unprocessed.push(movie.title); continue; }
    const date = Date.parse(check.checked_at);
    const hasPoster = check.has_poster === true;
    if (!Number.isFinite(date) || date > now + 300000 ||
        now - date > (hasPoster ? 8 : 1.5) * 86400000) {
      stale.push(movie.title);
    }
    if (hasPoster !== verified.has(key)) {
      throw Error('Poster audit and public image feed disagree: ' + key);
    }
    (hasPoster ? posters : unmatched).push(movie.title);
  }
  return {total: expected.size, checked: expected.size - unprocessed.length,
    posters, unmatched, unprocessed, stale,
    healthy: unprocessed.length === 0 && stale.length === 0};
}

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  try {
    const catalog = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
    const feed = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
    const report = auditPosterCoverage(catalog, feed);
    console.log('Public poster coverage: ' + report.posters.length + '/' + report.total +
      ' verified; ' + report.unmatched.length + ' checked without a verified match; ' +
      report.unprocessed.length + ' not yet checked; ' + report.stale.length + ' stale');
    if (report.unprocessed.length) console.log('Awaiting checks:', report.unprocessed.slice(0, 10));
    if (report.stale.length) console.log('Stale checks:', report.stale.slice(0, 10));
    if (!report.healthy) process.exitCode = 1;
  } catch (error) {
    console.error('Public poster audit failed:', error.message);
    process.exitCode = 1;
  }
}
