import assert from 'node:assert/strict';
import { BEWEGING_CSS } from './v18-beweging.mjs';

assert.match(
  BEWEGING_CSS,
  /\.bgx-vergelijk \.straks\{[^}]*padding-left:calc\(var\(--bgx-grens,50%\) \+ 28px\)/s,
  'De rechter tekst moet met de scheidslijn meeschuiven zodat hij niet achter de clip verdwijnt.'
);

assert.match(
  BEWEGING_CSS,
  /\.bgx-vergelijk \.nu li\{[^}]*color:rgba\(255,255,255,\.9\)!important/s,
  'Tekst aan de donkere kant moet expliciet voldoende contrast houden.'
);

console.log('Vergelijker-leesbaarheid contract groen.');
