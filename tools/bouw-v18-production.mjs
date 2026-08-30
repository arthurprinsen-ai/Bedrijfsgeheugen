await import('./bouw-v18-production-core.mjs');
await import('./apply-v18-seo.mjs');
const { applyCanonicalFootersToSite } = await import('./apply-canonical-footer.mjs');
await applyCanonicalFootersToSite();
console.log('Accepted historical V18 production build complete with persistent SEO and canonical footer');
