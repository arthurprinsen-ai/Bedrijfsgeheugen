import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const dir = new URL("../supabase/migrations/", import.meta.url);
const file = readdirSync(dir).find((f) => f.endsWith("_bg_experiment_controlegroep_v1.sql"));
const sql = file ? readFileSync(new URL(file, dir), "utf8") : "";

test("control-group function exists, is read-only and service_role only", () => {
  assert.ok(file, "migration missing");
  assert.match(sql, /stable security definer set search_path = ''/);
  assert.match(sql, /revoke all on function public\.bg_experiment_controlegroep\(text\) from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.bg_experiment_controlegroep\(text\) to service_role/);
  assert.doesNotMatch(sql, /\b(insert\s+into|update\s+public|delete\s+from)\b/i);
});

test("reuses the human-only measurement function instead of new measuring logic", () => {
  assert.match(sql, /intern\.bg_experiment_meet\(/);
  assert.match(sql, /not i\.is_robot/);
});

test("control excludes the tested page and every page with a running experiment", () => {
  assert.match(sql, /i\.pad <> e\.pagina/);
  assert.match(sql, /x\.status = 'ACTIVE'/);
  assert.match(sql, /limit 10/);
});

test("consistent is false unless sample, stability and positive difference all hold", () => {
  for (const reason of ["CONTROLE_STEEKPROEF_TE_KLEIN", "CONTROLE_ZELF_INSTABIEL", "GEEN_POSITIEF_VERSCHIL_T_O_V_CONTROLE", "GEEN_CONTROLEPAGINAS", "GEEN_UPLIFT_GEMETEN"]) {
    assert.match(sql, new RegExp(reason));
  }
  assert.match(sql, /abs\(ctrl_change\) > 0\.25/);
  assert.match(sql, /array_append\(v_redenen/);
  assert.doesNotMatch(sql, /v_redenen \|\|/, "text[] || 'literal' is ambiguous in Postgres");
});
