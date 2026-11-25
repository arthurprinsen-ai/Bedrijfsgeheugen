import assert from 'node:assert/strict';
import { ensureReleaseMarker, readReleaseMarker } from './release-marker.mjs';
import { verifyLiveSite } from './live-contract.mjs';

const COMMIT = '0123456789abcdef0123456789abcdef01234567';
const pricingMarkup = `
<div class="choice pil">
  <a class="on" href="#saas">Powerhouse SaaS</a>
  <a class="off" href="#expertise">Consulting & workshops</a>
</div>
<section id="saas">
  <article><h3>Starter</h3><div>€ 99 / maand</div></article>
  <article><h3>Pro</h3><div>€ 299 / maand</div></article>
  <article><h3>Groei</h3><div>€ 749 / maand</div></article>
  <article><h3>Enterprise</h3><div>Op maat</div></article>
</section>
<section id="expertise">
  <article><h3>Frisse Blik</h3></article>
  <article><h3>Directie & AI Workshop</h3></article>
  <article><h3>Bedrijfsgeheugen Scan</h3></article>
  <article><h3>Build Sprint</h3></article>
  <article><h3>Transformation / Fractional Lead</h3></article>
</section>
<section>
  <select id="pkgSize"></select>
  <select id="pkgGoal"></select>
  <select id="pkgMode"></select>
  <a id="pkgGo" href="/pakketadvies">Bekijk mijn pakket →</a>
</section>`;

const shell = ({ pricing = false, extraBeforeFooter = '', mobile = 'Oplossingen Platform Prijzen Kennis Over ons Meer' } = {}) => ensureReleaseMarker(`<!doctype html><html><head></head><body>
<div class="bg-uniform-trust" data-bg-component="trustbar">Duidelijke afspraken vooraf · Klein beginnen, resultaat toetsen · Voor het Nederlandse mkb</div>
<header class="v17-header" data-bg-component="header"><nav>hoofdmenu</nav></header>
<aside class="v18-mobile-drawer" data-bg-component="mobile-menu">${mobile}</aside>
<main data-bg-component="main">inhoud${pricing ? pricingMarkup : ''}</main>
${extraBeforeFooter}
<footer data-bg-component="footer"><a href="mailto:arthur@bedrijfsgeheugen.nl">mail</a><a href="tel:+31627483345">bel</a><span>ma–vr 08:00–18:00</span></footer>
</body></html>`, COMMIT);

const home = shell();
const pricing = shell({ pricing: true });
const content = shell();

assert.equal(readReleaseMarker(home), COMMIT);
assert.doesNotThrow(() => verifyLiveSite({ home, pricing, content, expectedCommit: COMMIT }));

const entityEncodedPricing = pricing.replace(
  '<h3>Directie & AI Workshop</h3>',
  '<h3>Directie &amp; AI Workshop</h3>'
);
assert.doesNotThrow(() => verifyLiveSite({
  home,
  pricing: entityEncodedPricing,
  content,
  expectedCommit: COMMIT
}));

assert.throws(() => verifyLiveSite({
  home: shell({ extraBeforeFooter: '<a href="mailto:arthur@bedrijfsgeheugen.nl">bovenaan</a>' }),
  pricing,
  content,
  expectedCommit: COMMIT
}), /buiten footer/i);

assert.throws(() => verifyLiveSite({
  home,
  pricing,
  content: shell({ mobile: 'Oplossingen Platform Kennis Over ons Meer' }),
  expectedCommit: COMMIT
}), /mobiel menu mist/i);

assert.throws(() => verifyLiveSite({
  home,
  pricing: pricing.replace('href="#saas"', 'href="#legacy"'),
  content,
  expectedCommit: COMMIT
}), /pricing-navigatie ontbreekt/i);

assert.throws(() => verifyLiveSite({
  home,
  pricing: pricing.replace('id="expertise"', 'id="consulting-old"'),
  content,
  expectedCommit: COMMIT
}), /pricing-sectie ontbreekt live/i);

assert.throws(() => verifyLiveSite({
  home,
  pricing: pricing.replace('<h3>Groei</h3>', '<h3>Scale</h3>'),
  content,
  expectedCommit: COMMIT
}), /canoniek SaaS-pakket ontbreekt live: Groei/i);

assert.throws(() => verifyLiveSite({
  home,
  pricing: pricing.replace('id="pkgGoal"', 'id="fitGoal"'),
  content,
  expectedCommit: COMMIT
}), /pakketadvies-control ontbreekt live/i);

assert.throws(() => verifyLiveSite({
  home,
  pricing: pricing.replace('</section>', '<button data-bg-billing="monthly">Maandelijks</button></section>'),
  content,
  expectedCommit: COMMIT
}), /retired billing-toggle contract/i);

assert.throws(() => verifyLiveSite({
  home,
  pricing,
  content,
  expectedCommit: 'ffffffffffffffffffffffffffffffffffffffff'
}), /release marker/i);

console.log('canonical built-pricing live contract: OK');

// Readback-mode contract: CLI stays strict unless explicitly opted in.
const { mkdtempSync,writeFileSync,rmSync,readFileSync } = await import('node:fs');
const {tmpdir}=await import('node:os');
const {join}=await import('node:path');
const {spawnSync}=await import('node:child_process');
const {fileURLToPath}=await import('node:url');
const dir=mkdtempSync(join(tmpdir(),'shell-readback-'));
try {
 const cli=fileURLToPath(new URL('./check-live-production.mjs',import.meta.url));
 const files={LIVE_HOME_FILE:join(dir,'home.html'),LIVE_PRICING_FILE:join(dir,'pricing.html'),LIVE_CONTENT_FILE:join(dir,'content.html')};
 const run=(args=[],pages={home,pricing,content})=>{
  for(const [key,value] of Object.entries(pages))writeFileSync(files['LIVE_'+key.toUpperCase()+'_FILE'],value);
  return spawnSync(process.execPath,[cli,...args],{env:{...process.env,...files,EXPECTED_COMMIT:COMMIT},encoding:'utf8'});
 };
 const bad={home,pricing:shell(),content};
 assert.equal(run().status,0);
 assert.notEqual(run([],bad).status,0);
 assert.equal(run(['--identity-only'],bad).status,0);
 assert.notEqual(run(['--identity-only','--other'],bad).status,0);
 assert.notEqual(run(['--other'],bad).status,0);
 assert.notEqual(run(['--identity-only'],{...bad,home:ensureReleaseMarker(home,'f'.repeat(40))}).status,0);
 assert.notEqual(run(['--identity-only'],{...bad,content:shell({mobile:'Oplossingen Platform Kennis Over ons Meer'})}).status,0);
 assert.notEqual(run(['--identity-only'],{...bad,home:shell({extraBeforeFooter:'<a href="mailto:arthur@bedrijfsgeheugen.nl">bovenaan</a>'})}).status,0);
 const workflow=readFileSync(new URL('../../.github/workflows/production-release-readback.yml',import.meta.url),'utf8');
 const canonical=readFileSync(new URL('../../.github/workflows/canonical-brand-shell-live-readback.yml',import.meta.url),'utf8');
 assert.ok(workflow.includes('BROWSER_REQUIRED: $'+'{{ steps.scope.outputs.browser_required }}'));
 assert.ok(workflow.includes('if [[ "$BROWSER_REQUIRED" == "true" ]]; then readback_args=(--identity-only); fi'));
 assert.ok(workflow.includes("steps.routes.outcome == 'success' && steps.pricing.outcome == 'success'"));
 assert.ok(!canonical.includes('--identity-only'));
 console.log('scoped identity-only CLI + caller preservation: 12/12 OK');
}finally{rmSync(dir,{recursive:true,force:true})}
