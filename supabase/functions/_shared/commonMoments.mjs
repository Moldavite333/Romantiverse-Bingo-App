// Editorial dealing preferences, not measured scene probabilities.
const common=new Set([
 'First meeting','Meet Cute','A misunderstanding','An interruption','A romantic gesture',
 'The almost-kiss','A romantic realization','A coincidence','Someone changes their mind',
 'An emotional reunion','A secret is discovered','A major change of plans',
 'Someone learns the true meaning of life','Everyone knows the ending except the leads',
 'A shared meal','A romantic confession','A heartfelt apology','A secret crush',
 'A chance encounter','An unexpected phone call','A thoughtful surprise','A long-awaited kiss',
 'A change of heart','A difficult choice','An awkward introduction','A moment of honesty',
 'A supportive friend','A chance to start over','A happy ending',
 'Hot cocoa','Hot cocoa fixes everything','Christmas lights','Christmas lights everywhere',
 'Christmas cookies','Christmas cookies are plot-critical','Tree decorating','A tree-decorating scene',
 'Cozy fireplace','A cozy fireplace moment','A family tradition','A family holiday tradition',
 'Autumn leaves','Autumn leaves everywhere','Flannel shirt','A flannel-clad love interest',
 'Cozy sweater','A cozy sweater','Apple cider','Apple cider conversation',
 'Fall decorations','Fall decorations montage'
].map(s=>s.toLowerCase()));
const specific=new Set([
 'Someone overhears the wrong half of a conversation','A town event saves the day',
 'Someone reveals a secret talent','Breaking down / stuck in town','Family tragedy',
 'Objects come to life','Time travel / parallel-universe life','Free food',
 'An unexpected sleigh ride','A sleigh ride','A Christmas miracle','Meddling Santas',
 'A rescued duckling changes the day','A kite gets tangled','A flower-arranging contest',
 "A cherry tree is planted in someone's honor",'A lifeguard comes to the rescue',
 'A sandcastle competition','A missed ferry changes the plans','A summer camp reunion',
 'A meaningful photograph','An important letter','A missed connection','A romantic getaway'
].map(s=>s.toLowerCase()));
export function commonMomentWeight(label){const key=String(label||'').trim().toLowerCase();return common.has(key)?4:specific.has(key)?.25:1}
export function weightedMoments(items,rng,label=item=>item.label){
 return items.map(item=>({item,rank:-Math.log(Math.max(Number.EPSILON,rng()))/commonMomentWeight(label(item))})).sort((a,b)=>a.rank-b.rank).map(row=>row.item);
}
