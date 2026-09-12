import fs from 'node:fs';
import { rankCandidates } from './learning.mjs';
import { buildSelectionRecord } from './selection-audit.mjs';

const [candidatesPath, learningPath='data/content-growth-learning.json', policyPath='config/content-growth-policy.json', date=''] = process.argv.slice(2);
if (!candidatesPath) throw new Error('candidates path required');
const candidates=JSON.parse(fs.readFileSync(candidatesPath,'utf8'));
const learning=JSON.parse(fs.readFileSync(learningPath,'utf8'));
const policy=JSON.parse(fs.readFileSync(policyPath,'utf8'));
const ranked=rankCandidates({candidates,learning,policy,date});
if (!ranked.length) process.exit(3);
const selected=ranked[0];

if(date){
  const ledgerPath='data/content-publication-ledger.json';
  const ledger=JSON.parse(fs.readFileSync(ledgerPath,'utf8'));
  const record=buildSelectionRecord({date,selected,mode:'brain_learning'});
  const existing=ledger.days?.[date];
  if(existing&&existing.content_id!==record.content_id)throw new Error(`DAILY_CONTENT_ID_CONFLICT:${date}:${existing.content_id}:${record.content_id}`);
  ledger.days ||= {};
  ledger.days[date]={...(existing||{}),...record};
  fs.writeFileSync(ledgerPath,`${JSON.stringify(ledger,null,2)}\n`);
}

console.log(JSON.stringify(selected));
