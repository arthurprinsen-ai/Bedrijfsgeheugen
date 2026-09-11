import { writeFile } from 'node:fs/promises';
import { isolateStandalonePages } from './standalone-page-router.mjs';
import { finalizeSiteContracts } from './site-shell/finalize-site-contracts.mjs';
import { applyConversionCta } from './site-shell/cta-conversie.mjs';

// Standalone URLs are real documents. They may inherit the historical homepage
// one-page router through the canonical shell; that router can remove the active
// view after a menu navigation and leave a completely white page. Strip only
// that router at the final build boundary, after every shell/page transformer.
await isolateStandalonePages();

// Eén primaire knopkleur (oranje) voor de publieke site — zie assets/cta-conversie.css.
// Na alle schil/paginabouwers, vóór de contractcontrole.
await applyConversionCta();

// Dit is bewust de allerlaatste HTML-contractlaag. Geen enkele writer mag hierna
// nog Kennis terug naar /blog/ kunnen zetten. Release-evidence wordt pas daarna
// geschreven, zodat de evidence exact bij de gevalideerde deploy-output hoort.
await finalizeSiteContracts();

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
