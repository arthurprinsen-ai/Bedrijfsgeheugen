import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const skillPath = ".agents/skills/powerhouse-connector-response-normalization/SKILL.md";
const learningPath = "brain/learning/2026-09-25-connector-response-shape-normalization-v1.json";

test("connector response normalization skill requires fail-before-mutation and bounded fallback", async () => {
  const skill = await readFile(skillPath, "utf8");

  assert.match(skill, /connector\|response-shape\|normalize-before-use\|v1/);
  assert.match(skill, /CONNECTOR_RESPONSE_SHAPE_MISMATCH/);
  assert.match(skill, /fail before ref mutation/i);
  assert.match(skill, /create_file.*update_file/s);
  assert.match(skill, /same canonical branch/i);
});

test("connector fallback remains owned through terminal proof", async () => {
  const skill = await readFile(skillPath, "utf8");

  assert.match(skill, /Terminal continuation rule/);
  assert.match(skill, /protected merge/i);
  assert.match(skill, /protected-main readback/i);
  assert.match(skill, /WRITEBACK_INCOMPLETE/);
  assert.match(skill, /do not return a healthy queued\/running gate to the user as a manual next action/i);
});

test("Brain learning projects connector response-shape prevention into skills", async () => {
  const learning = JSON.parse(await readFile(learningPath, "utf8"));

  assert.equal(learning.status, "ACTIVE_PREVENTION");
  assert.equal(learning.fingerprint, "connector|response-shape|normalize-before-use|v1");
  assert.ok(learning.prevention.includes("NORMALIZE_CONNECTOR_RESPONSES_BEFORE_CHAINED_MUTATION"));
  assert.ok(learning.prevention.includes("FAIL_BEFORE_REF_MUTATION_ON_MISSING_SHA_OR_ID"));
  assert.ok(learning.prevention.includes("CONTINUE_SAME_LINEAGE_TO_APPLICABLE_TERMINAL_PROOF"));
  assert.ok(learning.skill_targets.includes(".agents/skills/powerhouse-connector-response-normalization/SKILL.md"));
  assert.equal(learning.evidence.protected_main_merge_sha, "bc47d636675f9fea41044667797dade0962b03ef");
});