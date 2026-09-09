import fs from 'node:fs';
const path = process.argv[2] || 'config/content-growth-policy.json';
const policy = JSON.parse(fs.readFileSync(path,'utf8'));
if (policy.timeZone !== 'Europe/Amsterdam') throw new Error('timeZone must be Europe/Amsterdam');
if (!(policy.explorationRatio >= 0 && policy.explorationRatio <= 1)) throw new Error('explorationRatio invalid');
for (const key of ['order','revenue','qualified_lead','lead','cta','click','engagement','reach']) if (!(key in policy.weights)) throw new Error(`missing weight ${key}`);
console.log('CONTENT_GROWTH_POLICY_OK');
