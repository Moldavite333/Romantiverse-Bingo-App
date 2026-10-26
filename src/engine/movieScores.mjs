// One canonical score per movie, regardless of source catalog, calendar week, or card mode.
export function movieScoreKey(movie) {
  const title=String(movie?.title||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en');
  if(!title)return '';
  const rawYear=movie?.release_year;
  const year=Number(rawYear);
  return rawYear!==null&&rawYear!==undefined&&String(rawYear).trim()!==''&&
    Number.isInteger(year)&&year>=1888&&year<=2200 ? title+' ('+year+')' : title;
}

// Keep the underlying movie-night log intact, but show only the best score
// for each distinct movie. The latest play breaks ties.
export function bestMovieScores(history=[]) {
  const best=new Map();
  for(const item of Array.isArray(history)?history:[]) {
    const key=movieScoreKey(item);
    if(!key)continue;
    const previous=best.get(key);
    if(!previous||Number(item.lines||0)>Number(previous.lines||0)||
      (Number(item.lines||0)===Number(previous.lines||0)&&String(item.date||'')>String(previous.date||''))) {
      best.set(key,item);
    }
  }
  return [...best.values()].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
}
