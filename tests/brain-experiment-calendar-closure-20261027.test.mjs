import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const dir = new URL("../supabase/migrations/", import.meta.url);
const file = readdirSync(dir).find((f) => f.endsWith("_calendar_experiment_closure_v1.sql"));
const sql = file ? readFileSync(new URL(file, dir), "utf8") : "";

test("calendar experiment closure migration exists", () => {
  assert.ok(file, "migration missing");
});

test("only rci- calendar rows are closed; human-gated experiments are untouched", () => {
  assert.equal((sql.match(/experiment_id like 'rci-%'/g) || []).length >= 3, true);
  assert.match(sql, /status = 'PLANNED'/);
  assert.match(sql, /meetpunt is null/);
  assert.doesNotMatch(sql, /status = 'ACTIVE'\s*,\s*started_at/);
});

test("closure runs daily and is service_role only", () => {
  assert.match(sql, /cron\.schedule\('powerhouse-calendar-experiment-closure-daily-v1'/);
  assert.match(sql, /revoke all on function public\.powerhouse_close_stale_calendar_experiments_v1/);
  assert.match(sql, /security definer/);
  assert.match(sql, /set search_path = ''/);
});

test("staleness view is exposed for health checks", () => {
  assert.match(sql, /powerhouse_calendar_experiment_staleness_v1/);
});

test("AGENTS.md and skill carry the rule", () => {
  const agents = readFileSync(new URL("../AGENTS.md", import.meta.url), "utf8");
  const skill = readFileSync(new URL("../skills/powerhouse-experiment-calendar-closure.md", import.meta.url), "utf8");
  assert.match(agents, /Experiment-kalender sluit zichzelf/);
  assert.match(skill, /stale_planned/);
});
