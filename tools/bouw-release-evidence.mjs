import { writeFile } from 'node:fs/promises';
import { isolateStandalonePages } from './standalone-page-router.mjs';
import { finalizeSiteContracts } from './site-shell/finalize-site-contracts.mjs';
import { applyConversionCta } from './site-shell/cta-conversie.mjs';
import { applySitewideAnalytics } from './site-shell/analytics-sitebreed.mjs';
import { applyMoneyPrerender } from './site-shell/money-prerender.mjs';
import { applyLettertypeTerugval } from './site-shell/lettertype-terugval.mjs';
import { repairWijzigingenEncoding } from './site-shell/repair-wijzigingen-encoding.mjs';
import { readFile } from 'node:fs/promises';
import { resolveReleaseCommitRef } from './site-shell/release-source-identity.mjs';

// Standalone URLs are real documents. They may inherit the historical homepage
// one-page router through the canonical shell; that router can remove the active
// view after a menu navigation and leave a completely white page. Strip only
// that router at the final build boundary, after every shell/page transformer.
await isolateStandalonePages();

// Eén primaire knopkleur (oranje) voor de publieke site — zie assets/cta-conversie.css.
// Na alle schil/paginabouwers, vóór de contractcontrole.
await applyConversionCta();

// GA4 op elke publieke pagina, pas na toestemming, plus de klikmeting op de
// primaire knop — zie tools/site-shell/analytics-sitebreed.mjs.
await applySitewideAnalytics();

// Money-page blokken (prijs, doorlooptijd, besliskader) staan vooraf in de HTML
// in plaats van na het laden te verschijnen — zie money-prerender.mjs.
await applyMoneyPrerender();

// Terugvallettertype met dezelfde maten als Instrument Sans / Bricolage, zodat
// de fontwissel de pagina niet laat verspringen — zie lettertype-terugval.mjs.
await applyLettertypeTerugval();

// Herstel uitsluitend de bekende UTF-8→Windows-1252 mojibake op de wijzigingen-
// uitlegpagina. Dit draait vóór de finale contractlaag en bewaakt tegelijk dat de
// 76px railhoogte voor de tablet-CLS-fix behouden blijft.
await repairWijzigingenEncoding();

// Dit is bewust de allerlaatste HTML-contractlaag. Geen enkele writer mag hierna
// nog Kennis terug naar /blog/ kunnen zetten. Release-evidence wordt pas daarna
// geschreven, zodat de evidence exact bij de gevalideerde deploy-output hoort.
await finalizeSiteContracts();

let sourceMarker = '';
try {
  sourceMarker = await readFile('.bg-source-commit', 'utf8');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}
const commitRef = resolveReleaseCommitRef({ env: process.env, markerText: sourceMarker });
const evidence = {
  contract: 'BRAIN-DELIVERY-v2',
  production_authority: 'BG169',
  commit_ref: commitRef,
  context: String(process.env.CONTEXT || ''),
  deploy_id: String(process.env.DEPLOY_ID || ''),
  generated_at: new Date().toISOString(),
};
await writeFile('release.json', `${JSON.stringify(evidence, null, 2)}\n`);
console.log('RELEASE_EVIDENCE', commitRef);
