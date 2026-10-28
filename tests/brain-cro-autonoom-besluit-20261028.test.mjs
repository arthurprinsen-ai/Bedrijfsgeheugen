import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const dir = new URL("../supabase/migrations/", import.meta.url);
const file = readdirSync(dir).find((f) => f.endsWith("_bg_experiment_autonoom_besluit_v1.sql"));
const sql = file ? readFileSync(new URL(file, dir), "utf8") : "";

test("autonomous decision gate exists and is service_role only", () => {
  assert.ok(file, "migration missing");
  assert.match(sql, /security definer/);
  assert.match(sql, /set search_path = ''/);
  assert.match(sql, /revoke all on function public\.bg_experiment_autonoom_besluit\(text\) from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.bg_experiment_autonoom_besluit\(text\) to service_role/);
});

test("only ACTIVE experiments with advice are decided, max 3 per call", () => {
  assert.match(sql, /status = 'ACTIVE' and advies is not null/);
  assert.match(sql, /limit 3/);
  assert.doesNotMatch(sql, /status = 'PLANNED'/);
  assert.doesNotMatch(sql, /goedkeuren|afwijzen/);
});

test("keep requires a consistent control group; extend is capped at two", () => {
  assert.match(sql, /advies = 'behouden' and v_ctrl/);
  assert.match(sql, /v_verl < 2/);
  assert.match(sql, /WACHT_OP_CONTROLEGROEP/);
  assert.match(sql, /guardrails/);
});

test("decision records the agent as decider and never touches the human gate", () => {
  assert.match(sql, /agent:bg-experimentcyclus/);
  assert.doesNotMatch(sql, /create or replace function public\.bg_experiment_actie/);
});
