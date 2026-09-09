import fs from 'node:fs';
import { transitionLedger } from './daily-blog.mjs';

const [ledgerPath, date, proofPath] = process.argv.slice(2);
if (!ledgerPath || !date || !proofPath) throw new Error('usage: write-live-proof <ledger> <date> <proof.json>');
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
const proof = JSON.parse(fs.readFileSync(proofPath, 'utf8'));
const current = ledger.days[date];
if (!current) throw new Error(`ledger date missing: ${date}`);
if (current.state === 'live') {
  console.log(JSON.stringify(current));
  process.exit(0);
}
let next = current;
if (next.state === 'candidate') next = transitionLedger(next, { state: 'merged', merged_at: new Date().toISOString() });
if (next.state !== 'merged') throw new Error(`cannot prove live from ${next.state}`);
next = transitionLedger(next, { state: 'live', live_at: new Date().toISOString(), live_url: proof.url, live_proof: proof });
ledger.days[date] = next;
fs.writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
console.log(JSON.stringify(next));
