import { applyCustomerPortalAuth } from './apply-customer-portal-auth.mjs';
import { verifyCustomerLoginContract } from './verify-customer-login-contract.mjs';
import { applyCanonicalFootersToSite } from './apply-canonical-footer.mjs';

await import('./bouw-v18-production-core.mjs');
await import('./apply-v18-seo.mjs');
await applyCanonicalFootersToSite();
console.log(applyCustomerPortalAuth());
console.log(verifyCustomerLoginContract());
console.log('Accepted historical V18 production build complete with persistent SEO, canonical footer and customer auth');
