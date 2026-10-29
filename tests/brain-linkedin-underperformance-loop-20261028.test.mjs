import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const dir = new URL("../supabase/migrations/", import.meta.url);
const file = readdirSync(dir).find((f) => f.endsWith("_bg_linkedin_lus_v1.sql"));
const sql = file ? readFileSync(new URL(file, dir), "utf8") : "";
const orch = readFileSync(new URL("../supabase/functions/powerhouse-content-orchestrator/index.ts", import.meta.url), "utf8");

test("loop functions are security definer, search_path-locked and service_role only", () => {
  assert.ok(file, "migration missing");
  for (const sig of ["bg_social_lus_cyclus\\(text, date\\)", "bg_social_lus_beoordelen\\(date\\)", "bg_social_lus_meting\\(text, timestamptz, timestamptz\\)"]) {
    assert.match(sql, new RegExp(`revoke all on function public\\.${sig} from public, anon, authenticated`));
    assert.match(sql, new RegExp(`grant execute on function public\\.${sig} to service_role`));
  }
  assert.equal((sql.match(/security definer set search_path = ''/g) || []).length >= 4, true);
  assert.match(sql, /alter table public\.bg_linkedin_bewijs enable row level security/);
});

test("measurement sources stay read-only; loop never writes social_posts or snapshots", () => {
  assert.doesNotMatch(sql, /(insert into|update|delete from)\s+public\.social_(posts|metric_snapshots)/);
});

test("loop experiments cannot be picked up by CRO gates", () => {
  assert.match(sql, /recipe->>'soort' = 'linkedin_lus'/);
  const insert = sql.slice(sql.indexOf("insert into public.social_experiments"));
  assert.doesNotMatch(insert.split("values")[0], /\b(onderdeel|pagina|advies)\b/);
});

test("one primary variable at a time, idempotent registration, capped batch", () => {
  assert.match(sql, /EXPERIMENT_LOOPT/);
  assert.match(sql, /on conflict \(tenant_id, experiment_id\) do nothing/);
  assert.match(sql, /limit 5/);
});

test("outcome flows back into learning, decision and application tables, no fake significance", () => {
  assert.match(sql, /insert into public\.revenue_learnings/);
  assert.match(sql, /insert into public\.social_learning_decisions/);
  assert.match(sql, /insert into public\.social_learning_applications/);
  assert.match(sql, /VOOR_NA_VERGELIJKING_ZONDER_CONTROLEGROEP/);
  assert.match(sql, /INSUFFICIENT_EVIDENCE/);
  assert.match(sql, /confidence[\s\S]*?null, v_lstatus/);
});

test("rejected values are not proposed again; evidence needs source URL and date", () => {
  assert.match(sql, /l\.status = 'REJECTED'/);
  assert.match(sql, /bron_url ~ '\^https:\/\/'/);
  assert.match(sql, /BRON_URL_EN_DATUM_VERPLICHT/);
});

test("personal and company guardrails are kept in the instruction", () => {
  assert.match(sql, /ik-vorm, geen sales-CTA, geen link, geen emoji/);
  assert.match(sql, /geen engagement bait/);
  assert.match(sql, /Presenteer dit nooit als bewezen winnaar/);
});

test("orchestrator uses the loop through the allowlisted RPC only, failure never blocks the post", () => {
  assert.match(orch, /DIRECT_RPCS=new Set\(\[[^\]]*"bg_social_lus_cyclus"\]\)/);
  assert.match(orch, /db\.rpc\('bg_social_lus_cyclus',\{p_channel:pending\.channel,p_run_date:runDate\}\)/);
  assert.match(orch, /state:'SOURCE_UNAVAILABLE'/);
  assert.match(orch, /\+ linkedinLoopGuide \+/);
  assert.equal((orch.match(/linkedin_loop:linkedinLoop/g) || []).length, 2);
});
