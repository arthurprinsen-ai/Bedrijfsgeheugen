import test from 'node:test';
import assert from 'node:assert/strict';
import { isNetlifyGovernancePath } from '../tools/delivery/netlify-deployment-applicability.mjs';

test('control-plane and build-governance paths never require a Netlify runtime deploy', () => {
  for (const path of [
    'brain/learning/2026-10-06-control-plane-diet-v1.json',
    'scripts/brain/test-writer-verification-modes.mjs',
    'scripts/ci/blog_technical_seo_gate.py',
    'tools/build/artifact-id.mjs',
    'tools/build/release-evidence.mjs',
    'tools/netlify/ephemeral-janitor.mjs',
    'tools/notion/root-lifecycle.mjs',
    'tools/supabase/edge-function-registry.mjs',
    'config/brain-delivery-system.json',
    'config/build-contract.json',
    'config/control-plane-budget.json',
    'config/netlify-project-registry.json',
    'config/notion-root-lifecycle.json',
    'config/pr-trigger-baseline.json',
    'config/supabase-edge-functions.json',
    'schemas/delivery-evidence.schema.json',
    'tools/site-shell/verify-production-release.mjs',
    'tools/site-shell/verify-targeted-website-routes.mjs',
  ]) {
    assert.equal(isNetlifyGovernancePath(path), true, path);
  }
});

test('real website and runtime paths remain outside governance-only classification', () => {
  for (const path of [
    'index.html',
    'portal-v2/app.mjs',
    'netlify/functions/growth-event.mjs',
    'platform/api/brain-gateway.mjs',
  ]) {
    assert.equal(isNetlifyGovernancePath(path), false, path);
  }
});
