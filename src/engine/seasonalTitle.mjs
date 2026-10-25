// Infer only clearly identified seasonal titles. Never infer a movie's
// story season from its network, release date, or a generic "holiday" label.
// Null means unknown; callers must not silently substitute Christmas.
export function seasonalThemeFromTitle(title){
 const text=String(title||'');
 const christmas=/\b(?:christmas|xmas|mistletoe|santa|yuletide|noel)\b/i.test(text);
 const fall=/\b(?:autumn|harvest|pumpkin|thanksgiving)\b/i.test(text) ||
  (/\bfall\b/i.test(text)&&!/\bfall\s+(?:for|in love)\b/i.test(text));
 return christmas===fall?null:christmas?'Christmas':'Fall';
}
