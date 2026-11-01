// Compatibility entrypoint: dedicated local scene asset, never a category fallback.
import {requireIllustration} from './illustrationRegistry.mjs';
export function tropeArtDataUri(trope){return requireIllustration(trope).src;}
