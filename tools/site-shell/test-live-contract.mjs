import assert from 'node:assert/strict';
import { ensureReleaseMarker, readReleaseMarker } from './release-marker.mjs';
import { verifyLiveSite } from './live-contract.mjs';

const COMMIT = '0123456789abcdef0123456789abcdef01234567';
const shell = ({ pricing = false, extraBeforeFooter = '', mobile = 'ONTDEKKEN KENNIS & BEDRIJF START' } = {}) => ensureReleaseMarker(`<!doctype html><html><head></head><body>
<div class="bg-uniform-trust" data-bg-component="trustbar">Vaste prijs, geen uurtje-factuurtje · In twee weken draaiend · Voor het Nederlandse mkb</div>
<header class="v17-header" data-bg-component="header"><nav>hoofdmenu</nav></header>
<aside class="v18-mobile-drawer" data-bg-component="mobile-menu">${mobile}</aside>
<main data-bg-component="main">inhoud${pricing ? '<section data-bg-component="page-tools"><div class="bgx-vraagbalk"></div><div class="bgx-rekenaar"></div><div class="bgx-rol"></div></section>' : ''}</main>
${extraBeforeFooter}
<footer data-bg-component="footer"><a href="mailto:arthur@bedrijfsgeheugen.nl">mail</a><a href="tel:+31627483345">bel</a><span>ma–vr 08:00–18:00</span></footer>
</body></html>`, COMMIT);

const home = shell();
const pricing = shell({ pricing: true });
const content = shell();

assert.equal(readReleaseMarker(home), COMMIT);
assert.doesNotThrow(() => verifyLiveSite({ home, pricing, content, expectedCommit: COMMIT }));

assert.throws(() => verifyLiveSite({
  home: shell({ extraBeforeFooter: '<a href="mailto:arthur@bedrijfsgeheugen.nl">bovenaan</a>' }),
  pricing,
  content,
  expectedCommit: COMMIT
}), /buiten footer/i);

assert.throws(() => verifyLiveSite({
  home: shell({ pricing: true }),
  pricing,
  content,
  expectedCommit: COMMIT
}), /buiten prijzen/i);

assert.throws(() => verifyLiveSite({
  home,
  pricing,
  content: shell({ mobile: 'ONTDEKKEN START' }),
  expectedCommit: COMMIT
}), /mobiel menu mist/i);

assert.throws(() => verifyLiveSite({
  home,
  pricing,
  content,
  expectedCommit: 'ffffffffffffffffffffffffffffffffffffffff'
}), /release marker/i);

console.log('canonical shell live contract: OK');
