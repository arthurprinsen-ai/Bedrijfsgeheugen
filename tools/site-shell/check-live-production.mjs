import { readFile } from 'node:fs/promises';
import { verifyLiveSite } from './live-contract.mjs';

const args = process.argv.slice(2);
if (args.length && (args.length !== 1 || args[0] !== '--identity-only')) throw Error('UNKNOWN_READBACK_MODE');
const identityOnly = args[0] === '--identity-only';
const expectedCommit = process.env.EXPECTED_COMMIT || process.env.GITHUB_SHA;
const [home, pricing, content] = await Promise.all([
  readFile(process.env.LIVE_HOME_FILE || 'live-home.html', 'utf8'),
  readFile(process.env.LIVE_PRICING_FILE || 'live-prijzen.html', 'utf8'),
  readFile(process.env.LIVE_CONTENT_FILE || 'live-over-ons.html', 'utf8')
]);

const hashes = verifyLiveSite({ home, pricing, content, expectedCommit, verifyPricingSemantics: !identityOnly });
console.log(`Live ${identityOnly ? 'identity-only canonical shell' : 'strict canonical shell and pricing'} OK voor ${expectedCommit}: ${JSON.stringify(hashes)}`);
