import { applyCustomerPortalAuth } from './apply-customer-portal-auth.mjs';
import { verifyCustomerLoginContract } from './verify-customer-login-contract.mjs';
import { applyHomepageProcessProgress } from './bouw-v18-homepage-process-progress.mjs';

await import('./bouw-v18-production-core.mjs');
await import('./apply-v18-seo.mjs');
await import('./bouw-losse-paginas.mjs');
await import('./bouw-inhoudspaginas.mjs');

// Final homepage interaction boundary: the moving process line and the four
// process cards share one cumulative state contract. Run this after every
// historical V18 builder so later page transformers cannot restore the old
// dimmed 02/03/04 behavior.
await applyHomepageProcessProgress();

console.log(applyCustomerPortalAuth());
console.log(verifyCustomerLoginContract());
console.log('Accepted historical V18 content build complete; canonical brand shell is projected in the final page-policy stage');
