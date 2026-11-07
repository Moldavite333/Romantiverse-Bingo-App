import labels from './shortLabels.json' with {type:'json'};
import {resolveIllustration} from './illustrationRegistry.mjs';
import {displayLabel} from './displayLabel.mjs';

// Presentation only. Canonical names remain in aria-labels, card data and rooms.
export function shortLabel(trope){
 return displayLabel(labels[resolveIllustration(trope)?.id]||trope?.label||'Unnamed trope');
}
