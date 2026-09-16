import { writeFile } from 'node:fs/promises';
import { isolateStandalonePages } from './standalone-page-router.mjs';
import { finalizeSiteContracts } from './site-shell/finalize-site-contracts.mjs';
import { applyConversionCta } from './site-shell/cta-conversie.mjs';
import { applySitewideAnalytics } from './site-shell/analytics-sitebreed.mjs';
import { applyMoneyPrerender } from './site-shell/money-prerender.mjs';
import { applyLettertypeTerugval } from './site-shell/lettertype-terugval.mjs';
import { repairWijzigingenEncoding } from './site-shell/repair-wijzigingen-encoding.mjs';
import { ensureBlogContentIds } from './site-shell/ensure-blog-content-id.mjs';

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

// Dit is bewust de allerlaatste algemene HTML-contractlaag. Geen enkele writer
// mag hierna Kennis terug naar /blog/ kunnen zetten.
await finalizeSiteContracts();

// De V18 chrome-builder maakt blogpagina's opnieuw op en nam historische
// <body>-attributen niet mee. Daardoor kon GitHub de juiste content identity
// bevatten terwijl het uiteindelijke Netlify-artefact die verloor. Borg de
// semantische publicatie-identiteit daarom op de finale build-output zelf.
// Deze stap is deterministisch (blog:<slug>) en verifieert fail-closed.
const blogIdentity = await ensureBlogContentIds();
console.log(`BLOG_CONTENT_ID_CONTRACT ${blogIdentity.checked} checked, ${blogIdentity.changed} normalized`);

// Release-evidence wordt pas na alle HTML-contracten geschreven, zodat de
// evidence exact bij de gevalideerde deploy-output hoort.
const commitRef = String(process.env.COMMIT_REF || process.env.HEAD || '').trim();
if (!/^[a-f0-9]{40}$/i.test(commitRef)) {
  throw new Error('Netlify COMMIT_REF/HEAD is required for exact production evidence');
}
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
