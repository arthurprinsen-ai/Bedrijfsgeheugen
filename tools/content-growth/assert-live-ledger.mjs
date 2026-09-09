import fs from 'node:fs';
import { businessDate } from './daily-blog.mjs';
const [ledgerPath='data/content-publication-ledger.json', dateArg=''] = process.argv.slice(2);
const ledger=JSON.parse(fs.readFileSync(ledgerPath,'utf8'));
const date=dateArg || businessDate(new Date(),'Europe/Amsterdam');
const record=ledger.days?.[date];
if (!record || record.state !== 'live') {
  console.error(JSON.stringify({code:'DAILY_BLOG_NOT_LIVE',date,record:record||null}));
  process.exit(1);
}
console.log(JSON.stringify({code:'DAILY_BLOG_LIVE',date,record}));
