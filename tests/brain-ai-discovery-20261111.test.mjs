import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const robots = readFileSync(new URL('../robots.txt', import.meta.url), 'utf8');
const profile = readFileSync(new URL('../llms.txt', import.meta.url), 'utf8');
const blocks = robots.trim().split(/\n\s*\n/g);

function botBlock(name) {
  return blocks.find(block => block.split('\n').some(line => line.trim().toLowerCase() === 'user-agent: ' + name.toLowerCase()));
}

test('ChatGPT and Claude search/user crawlers are explicitly permitted without training dependence', () => {
  for (const name of ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User']) {
    const block = botBlock(name);
    assert.ok(block, 'Missing explicit crawler rule for ' + name);
    assert.match(block, /^Allow:\s*\/$/m, 'Crawler is not explicitly allowed: ' + name);
    assert.doesNotMatch(block, /^Disallow:\s*\/$/m, 'Crawler is blocked: ' + name);
  }
  assert.match(robots, /Sitemap:\s*https:\/\/www\.bedrijfsgeheugen\.nl\/sitemap\.xml/i);
});

test('public AI-readable positioning stays consistent with the existing portal proposition', () => {
  assert.match(profile, /eigen portaal\/platform/i);
  assert.match(profile, /bestaande systemen/i);
  assert.match(profile, /advies, scans, integraties/i);
  assert.doesNotMatch(profile, /adviesbureau zonder eigen product|geen eigen product/i);
  assert.match(profile, /garanderen geen opname, bronvermelding of aanbeveling/i);
});
