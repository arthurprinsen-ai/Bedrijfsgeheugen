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

test('AI-answer GEO belongs to the existing SEO agent, skill, system map and learning pathway', () => {
  const fp = 'seo|public-ai-search-discovery-and-proposition-truth|20261111-v1';
  const growth = JSON.parse(readFileSync(new URL('../config/seo-growth-loop.json', import.meta.url), 'utf8'));
  const a = growth.optimization.ai_answer_visibility;
  assert.equal(a.fingerprint, fp);
  assert.match(a.owner, /Powerhouse SEO Order Engine/);
  assert.match(a.scheduler, /never create second scheduler/);
  assert.equal(a.citation_sample.prompt_panel_size_target, 20);
  assert.deepEqual(a.citation_sample.providers, ['ChatGPT','Claude']);
  assert.match(a.citation_sample.unavailable_state,/NOT_MEASURED/);
  assert.equal(a.production_proven,false);
  assert.equal(a.visibility_proven,false);
  const agents = readFileSync(new URL('../platform/agents/agent-team.mjs', import.meta.url), 'utf8');
  assert.match(agents,/verify-chatgpt-and-claude-search-crawler-access-and-public-product-truth/);
  assert.match(agents,/hand-off-ai-answer-intent-owner-and-conversion-evidence-to-original-SEO-Brain-Heartbeat-loop/);
  const skill = readFileSync(new URL('../.agents/skills/powerhouse-seo-conversion-orders/SKILL.md',import.meta.url),'utf8');
  const skillRevenue = readFileSync(new URL('../.agents/skills/seo-revenue-growth/SKILL.md',import.meta.url),'utf8');
  assert.ok(skill.includes(fp));
  assert.ok(skillRevenue.includes(fp));
  assert.match(skill,/geen bewijs van vermelding in ChatGPT\/Claude/);
  const map = readFileSync(new URL('../platform/system-map/canonical-system-map.mjs',import.meta.url),'utf8');
  assert.match(map,/aiAnswerVisibility:Object\.freeze/);
  assert.ok(map.includes(fp));
  const reg = JSON.parse(readFileSync(new URL('../docs/brain/component-registry.json',import.meta.url),'utf8'));
  const cap = reg.components.find(c => c.key === 'CAPABILITY_SEO_CONVERSION_ORDERS');
  assert.equal(cap.ai_answer_visibility.fingerprint,fp);
  assert.equal(cap.ai_answer_visibility.no_new_scheduler,true);
  const lesson = JSON.parse(readFileSync(new URL('../brain/learning/2026-11-11-ai-search-discoverability-v1.json',import.meta.url),'utf8'));
  assert.equal(lesson.production_proven,false);
  assert.equal(lesson.ai_citation_proven,false);
  assert.deepEqual(lesson.evaluation.historical_replay,['tests/brain-ai-discovery-20261111.test.mjs']);
});
