// Presentation only: canonical labels still identify artwork, saved cards and rooms.
export function displayLabel(label){return String(label??'').replace(/^first meeting$/i,'Meet Cute').replace(/(?<=[\p{L}\p{N}])[-‐‑](?=[\p{L}\p{N}])/gu,' ')}
