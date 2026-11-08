/** Public Romantiverse Bingo launch scope. Horror remains archived for a separate game. */
export const LAUNCH_THEMES = Object.freeze(['Romance', 'Spring', 'Summer', 'Fall', 'Christmas']);
export const LAUNCH_SEASONAL_THEMES = Object.freeze(['Spring', 'Summer', 'Fall', 'Christmas']);
export const themeLabel = theme => theme === 'Romance' ? 'No Season' : theme;
export function resolveCardTheme(movie, choice='Auto') {
  if (LAUNCH_THEMES.includes(choice)) return choice;
  return LAUNCH_THEMES.includes(movie?.season) ? movie.season : 'Romance';
}

/** Only explicit catalog classifications are excluded; never infer genre from a title. */
export function isLaunchMovie(movie) {
  if (!movie || typeof movie !== 'object') return false;
  return ![movie.season, movie.movie_collection, movie.collection]
    .some(value => String(value || '').trim().toLowerCase() === 'horror');
}
