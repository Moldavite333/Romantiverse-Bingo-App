// Keep a late polling response from undoing a newer server-confirmed mark.
// The backend increments each player's revision on every successful mark.
export function nextPlayerSnapshot(previous, response) {
  if (!response || !Number.isInteger(response.revision) || response.revision < 0 ||
      response.revision < previous.revision || !Array.isArray(response.marked)) return previous;
  if (!response.marked.every(index => Number.isInteger(index) && index >= 0 && index <= 24)) return previous;
  return { revision: response.revision, marked: [...new Set(response.marked)].sort((a, b) => a - b) };
}
