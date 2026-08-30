import { applyCustomerPortalAuth } from './apply-customer-portal-auth.mjs';

await import('./bouw-v18-production-core.mjs');
await import('./apply-v18-seo.mjs');
await import('./apply-canonical-footer.mjs');
console.log(applyCustomerPortalAuth());
console.log('Accepted historical V18 production build complete with persistent SEO, canonical footer and customer auth');
