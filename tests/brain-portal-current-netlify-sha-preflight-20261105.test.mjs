import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const skill = readFileSync('.agents/skills/portal-living-interface/SKILL.md', 'utf8');
const workflow = readFileSync('.github/workflows/portal-v2-production-dom-readback.yml', 'utf8');
const section = skill.split('## 2026-11-05 — Mandatory fresh Netlify SHA before every Portal production check')[1] || '';

test('original owner must read current Netlify release before every production check', () => {
  assert.ok(section, 'missing original-owner production identity preflight');
  for (const required of [
    /Before \*\*each\*\* production browser check/i,
    /current published production deployment/i,
    /release\.json/,
    /Cache-Control: no-cache/,
    /40-character hexadecimal/,
    /immutable Netlify deployment/,
    /approved_pr_number/,
    /production_sha/,
    /fail closed/,
    /independently read back/,
    /ONE BRAIN/,
    /next original owner run/
  ]) assert.match(section, required);
  assert.doesNotMatch(section, /production_sha\s*=\s*[0-9a-f]{40}/i, 'never pin an old production SHA');
});

test('existing production browser self-triggers for the exact owner skill path', () => {
  const push = workflow.split('on:\n')[1]?.split('  workflow_dispatch:')[0] || '';
  assert.match(push, /push:\s*\n\s*branches: \[main\]/);
  assert.match(push, /- '\.agents\/skills\/portal-living-interface\/SKILL\.md'/);
  assert.equal((push.match(/portal-living-interface\/SKILL\.md/g) || []).length, 1);
  assert.doesNotMatch(push, /- '\.agents\/\*\*'/);
  assert.doesNotMatch(push, /- '\.agents\/skills\/\*\*'/);
});

test('exact SHA, immutable deployment and post-browser safety guards remain intact', () => {
  for (const required of [
    /Pin already-published Netlify SHA only for exact evidence-only push/,
    /Verify published SHA override is strictly scoped to CI and evidence/,
    /git merge-base --is-ancestor/,
    /PORTAL_PUBLISHED_CI_ONLY_VERIFIED/,
    /approved_pr_number/,
    /Wait for exact deployed SHA and pin immutable deploy/,
    /Read back Portal V2 DOM, standalone routing and CSRD assets/,
    /Read back hydrated mobile demoAI shell/,
    /Reverify canonical browser release after browser\/visual readbacks/
  ]) assert.match(workflow, required);
  const fences = workflow.match(/case "\$file" in\s*\n\s*AGENTS\.md\|\.agents\/skills\/\*\|/g) || [];
  assert.equal(fences.length, 2, 'keep both strict, narrow source-only fences');
  assert.doesNotMatch(workflow, /supabase\/functions\/\*\|/, 'no broad Supabase runtime bypass');
});
