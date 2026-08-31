import { applyCustomerPortalAuth } from './apply-customer-portal-auth.mjs';
import { verifyCustomerLoginContract } from './verify-customer-login-contract.mjs';

await import('./bouw-v18-production-core.mjs');
await import('./apply-v18-seo.mjs');
await import('./bouw-losse-paginas.mjs');
await import('./bouw-inhoudspaginas.mjs');
await import('./uniforme-schil.mjs');
console.log(applyCustomerPortalAuth());
console.log(verifyCustomerLoginContract());
console.log('Accepted historical V18 production build complete with persistent SEO and customer auth');
