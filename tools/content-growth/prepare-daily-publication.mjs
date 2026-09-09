import fs from 'node:fs';
import { businessDate, resolveDailyPublication } from './daily-blog.mjs';
import { rankCandidates, explorationForDate } from './learning.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [k, ...rest] = arg.replace(/^--/, '').split('=');
  return [k, rest.join('=')];
}));
const policyPath = args.policy || 'config/content-growth-policy.json';
const ledgerPath = args.ledger || 'data/content-publication-ledger.json';
const learningPath = args.learning || 'data/content-growth-learning.json';
const candidatesPath = args.candidates || '/tmp/daily-blog-candidates.json';
const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
const learning = JSON.parse(fs.readFileSync(learningPath, 'utf8'));
const date = args.date || businessDate(new Date(), policy.timeZone || 'Europe/Amsterdam');
const rawCandidates = JSON.parse(fs.readFileSync(candidatesPath, 'utf8'));
const candidates = rankCandidates({ candidates: rawCandidates, learning, policy, date });
const decision = resolveDailyPublication({ date, ledger, candidates, learning: { ...learning, explore_today: explorationForDate(date, policy) }, policy });
console.log(JSON.stringify(decision));
if (decision.type === 'NO_ELIGIBLE_DAILY_BLOG') process.exitCode = 3;
