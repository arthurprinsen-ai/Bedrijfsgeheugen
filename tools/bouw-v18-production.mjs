import { applyCustomerPortalAuth } from './apply-customer-portal-auth.mjs';
import { applyCanonicalFootersToSite } from './apply-canonical-footer.mjs';

await import('./bouw-v18-production-core.mjs');
await import('./apply-v18-seo.mjs');
await applyCanonicalFootersToSite();
console.log(applyCustomerPortalAuth());
console.log('Accepted historical V18 production build complete with persistent SEO, canonical footer and customer auth');
