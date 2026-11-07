import React from 'react';
import {displayLabel} from './engine/displayLabel.mjs';
import {shortLabel} from './engine/shortLabels.mjs';

export default function BoardLabel({trope}){
 const free=trope.category==='free'||trope.id==='free';
 return <span className="square-label">{free?'CHEESE LOUISE POD':<><span className="board-label-full">{displayLabel(trope.label)}</span><span className="board-label-short">{shortLabel(trope)}</span></>}</span>;
}
