// Infer only clearly identified seasonal titles. Never infer a movie's
// story season from its network, release date, or a generic "holiday" label.
// Null means unknown; callers must not silently substitute Christmas.
export function seasonalThemeFromTitle(title){
 const text=String(title||'');
 const christmas=/\b(?:christmas|xmas|mistletoe|santa|yuletide|noel)\b/i.test(text);
 const fall=/\b(?:autumn|harvest|pumpkin|thanksgiving)\b/i.test(text) ||
  (/\bfall\b/i.test(text)&&!/\bfall\s+(?:for|in love)\b/i.test(text));
 const spring=/\b(?:spring|easter|blossoms?)\b/i.test(text);
 const summer=/\bsummer\b/i.test(text);
 const matches=[['Christmas',christmas],['Fall',fall],['Spring',spring],['Summer',summer]].filter(([,match])=>match);
 return matches.length===1?matches[0][0]:null;
}
