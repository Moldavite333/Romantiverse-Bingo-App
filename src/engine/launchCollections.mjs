/** Public Romantiverse Bingo launch scope. Horror remains archived for a separate game. */
export const LAUNCH_THEMES = Object.freeze(['Romance', 'Christmas', 'Fall']);
export const LAUNCH_SEASONAL_THEMES = Object.freeze(['Christmas', 'Fall']);

/** Only explicit catalog classifications are excluded; never infer genre from a title. */
export function isLaunchMovie(movie) {
  if (!movie || typeof movie !== 'object') return false;
  return ![movie.season, movie.movie_collection, movie.collection]
    .some(value => String(value || '').trim().toLowerCase() === 'horror');
}
