import fs from 'node:fs';
import { classifyQualityImpact, loadQualityContract } from '../powerhouse-quality-intelligence.mjs';

const pathsFile = process.env.QUALITY_CHANGED_PATHS_FILE;
const inline = process.env.QUALITY_CHANGED_PATHS || '';
let paths = [];
if (pathsFile && fs.existsSync(pathsFile)) {
  paths = fs.readFileSync(pathsFile, 'utf8').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
} else if (inline) {
  paths = inline.split(/\r?\n|,/).map(x => x.trim()).filter(Boolean);
}

const impact = classifyQualityImpact(paths, loadQualityContract());
const payload = {
  fingerprint: 'powerhouse-quality-impact-v1',
  changed_paths: impact.paths,
  suites: impact.suites,
  suite_csv: impact.suites.join(','),
  has_frontend: impact.suites.some(x => ['frontend','visual','portal','cockpit','accessibility'].includes(x)),
  has_backend: impact.suites.some(x => ['backend','api_contract','property','resilience','data_integrity','performance'].includes(x)),
  has_security: impact.suites.some(x => ['security','supply_chain'].includes(x)),
  has_quality_contract: impact.suites.includes('quality_contract')
};

process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `suites=${payload.suite_csv}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_frontend=${payload.has_frontend}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_backend=${payload.has_backend}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_security=${payload.has_security}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_quality_contract=${payload.has_quality_contract}\n`);
}
