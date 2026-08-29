export function createWebsiteBusinessTruthView({ tenantId, proposition, offerings = [], pricePlans = [], segments = [], generatedAt, sourceStateVersion }) {
  if (!tenantId || !generatedAt || !Number.isInteger(sourceStateVersion)) throw new TypeError('website business truth view requires tenantId, generatedAt and sourceStateVersion');
  return Object.freeze({
    name:'WebsiteBusinessTruthView', tenantId, generatedAt, sourceStateVersion,
    proposition: proposition ? Object.freeze({ ...proposition }) : null,
    offerings:Object.freeze(offerings.map(x=>Object.freeze({ ...x }))),
    pricePlans:Object.freeze(pricePlans.map(x=>Object.freeze({ ...x }))),
    segments:Object.freeze(segments.map(x=>Object.freeze({ ...x }))),
  });
}

export function detectCommercialTruthConflict({ canonicalPrice, websitePrice, billingPrice }) {
  const values = [canonicalPrice, websitePrice, billingPrice];
  const distinct = new Set(values.filter(v => v != null));
  if (distinct.size <= 1) return null;
  return Object.freeze({ type:'PricingConsistencyFinding', truthClass:'DerivedTruth', severity:'High', canonicalPrice, websitePrice, billingPrice });
}
