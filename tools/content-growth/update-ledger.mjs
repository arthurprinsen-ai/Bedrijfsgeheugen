import fs from 'node:fs';
import { transitionLedger } from './daily-blog.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [k, ...rest] = arg.replace(/^--/, '').split('=');
  return [k, rest.join('=')];
}));
const path = args.ledger || 'data/content-publication-ledger.json';
const date = args.date;
if (!date) throw new Error('--date is required');
const ledger = JSON.parse(fs.readFileSync(path, 'utf8'));
const existing = ledger.days[date];
const payload = JSON.parse(args.event || '{}');
if (!existing) {
  if (payload.state !== 'selected') throw new Error('new ledger record must start selected');
  ledger.days[date] = payload;
} else {
  ledger.days[date] = transitionLedger(existing, payload);
}
fs.writeFileSync(path, `${JSON.stringify(ledger, null, 2)}\n`);
console.log(JSON.stringify(ledger.days[date]));
