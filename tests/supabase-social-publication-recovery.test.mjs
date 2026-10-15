import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const runner = readFileSync("supabase/functions/social-recovery-runner/index.ts", "utf8");
const workflow = readFileSync(".github/workflows/social-publication-recovery.yml", "utf8");

test("Bearer parser exists and strictly parses service-role authorization", () => {
  const match = runner.match(/const bearer = \(req: Request\) => \{([\s\S]*?)\n\};/);
  assert.ok(match, "The authenticated runner must define bearer(req)");
  const parse = runInNewContext(
    '(req) => {' + match[1] + '}',
    { clean: (v) => String(v ?? "").trim() }
  );
  const req = (value) => ({ headers: { get: () => value } });
  assert.equal(parse(req("Bearer secret-token")), "secret-token");
  assert.equal(parse(req("bearer secret-token")), "secret-token");
  assert.equal(parse(req("Basic secret-token")), "");
  assert.equal(parse(req(null)), "");
  assert.equal(parse(req("Bearer ")), "");
});

test("recovery is independently scheduled, not only manually dispatched", () => {
  assert.match(workflow, /\n  schedule:\n/);
  assert.match(workflow, /cron: '[^']+\* \* \*'/);
  assert.match(workflow, /social-recovery-runner/);
  assert.match(workflow, /node --test tests\/supabase-social-publication-recovery\.test\.mjs/);
  assert.match(workflow, /EVENT_NAME:.*github\.event_name/);
  assert.match(workflow, /\$\{EVENT_NAME\}.*push/);
});

test("recovery still requires provider evidence and same-day identity", () => {
  assert.match(runner, /SERVICE_ROLE_REQUIRED/);
  assert.match(runner, /SAME_DAY_RECOVERY_ONLY/);
  assert.match(runner, /providerTruthHealthy/);
  assert.match(runner, /providerSideEffectTruthHealthy/);
  assert.match(runner, /republish_forbidden/);
  assert.match(workflow, /SOCIAL_PUBLICATION_UNRESOLVED/);
});
