import fs from 'node:fs';
import { aggregateContentPerformance } from './aggregate.mjs';
import { buildLearningContext } from './learning.mjs';

const [eventsPath = 'data/content-growth-events.json', policyPath = 'config/content-growth-policy.json', outputPath = 'data/content-growth-learning.json'] = process.argv.slice(2);
const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
const events = fs.existsSync(eventsPath) ? JSON.parse(fs.readFileSync(eventsPath, 'utf8')) : [];
const list = Array.isArray(events) ? events : (events.events || []);
const performance = aggregateContentPerformance(list, policy);
const learning = buildLearningContext({ performance, now: new Date(), policy });
fs.mkdirSync(outputPath.split('/').slice(0, -1).join('/') || '.', { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(learning, null, 2)}\n`);
console.log(JSON.stringify({ output: outputPath, observed_items: learning.confidence.observed_items, revenue: learning.commercial_totals.revenue, orders: learning.commercial_totals.orders }));
