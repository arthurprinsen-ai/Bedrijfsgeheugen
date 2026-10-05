import { readFile } from 'node:fs/promises';
import { verifyLiveSite } from './live-contract.mjs';

const expectedCommit = process.env.EXPECTED_COMMIT || process.env.GITHUB_SHA;
const [home, pricing, content] = await Promise.all([
  readFile(process.env.LIVE_HOME_FILE || 'live-home.html', 'utf8'),
  readFile(process.env.LIVE_PRICING_FILE || 'live-prijzen.html', 'utf8'),
  readFile(process.env.LIVE_CONTENT_FILE || 'live-over-ons.html', 'utf8')
]);

// This step proves release identity + canonical shell only. Pricing/content
// semantics are verified by dedicated gates later in the workflow, so unrelated
// UI drift cannot deadlock an otherwise exact production deployment.
const hashes = verifyLiveSite({ home, pricing, content, expectedCommit, verifyPricingSemantics: false });
console.log(`Live release identity + canonical shell OK voor ${expectedCommit}: ${JSON.stringify(hashes)}`);
