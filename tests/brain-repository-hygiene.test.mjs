import test from "node:test";
import assert from "node:assert/strict";
import {
  candidateFamily,
  filesAreDiscardable,
  isControlledWriterBranch,
  mayDeleteOrphanBranch,
  parseObligationLineage,
  mayAutoCloseSupersededObligation,
  cancellableWorkflowRuns
} from "../scripts/brain/repository-hygiene.mjs";

const policy = {
  candidate_families: [
    {
      id: "paginacontrole",
      title_prefix: "Paginacontrole candidate ",
      branch_prefix: "writer/paginacontrole/",
      auto_close_when_superseded: true,
      discardable_files: ["seo-status.json"]
    }
  ],
  orphan_branch_cleanup_prefixes: ["writer/paginacontrole/", "writer/seo-controle/"],
  protected_prefixes: ["main", "archive/", "backup/"]
};

test("classifies generated candidate family", () => {
  assert.equal(candidateFamily({ title: "Paginacontrole candidate 123" }, policy)?.id, "paginacontrole");
});

test("only exact discardable file set is auto-close eligible", () => {
  const family = policy.candidate_families[0];
  assert.equal(filesAreDiscardable([{ filename: "seo-status.json" }], family), true);
  assert.equal(filesAreDiscardable([{ filename: "netlify.toml" }], family), false);
  assert.equal(filesAreDiscardable([{ filename: "seo-status.json" }, { filename: "netlify.toml" }], family), false);
});

test("recognizes only controlled writer prefixes", () => {
  assert.equal(isControlledWriterBranch("writer/paginacontrole/abc", policy), true);
  assert.equal(isControlledWriterBranch("brain/important-unique-work", policy), false);
});

test("deletes orphan writer branch only when it has no unique commits", () => {
  assert.equal(mayDeleteOrphanBranch({
    branch: "writer/paginacontrole/abc",
    openHeads: new Set(),
    aheadBy: 0,
    policy
  }), true);
  assert.equal(mayDeleteOrphanBranch({
    branch: "writer/paginacontrole/abc",
    openHeads: new Set(),
    aheadBy: 1,
    policy
  }), false);
  assert.equal(mayDeleteOrphanBranch({
    branch: "writer/paginacontrole/abc",
    openHeads: new Set(["writer/paginacontrole/abc"]),
    aheadBy: 0,
    policy
  }), false);
});


test("parses canonical obligation lineage without guessing", () => {
  assert.deepEqual(
    parseObligationLineage({ body: "Obligation-ID: OBL-1\nSupersedes: 42\n" }),
    { obligationId: "OBL-1", supersedes: 42 }
  );
  assert.deepEqual(
    parseObligationLineage({ body: "Obligation-ID: OBL-1\nSupersedes: none\n" }),
    { obligationId: "OBL-1", supersedes: null }
  );
});

test("auto-closes only explicit newer same-obligation successors", () => {
  const predecessor={number:42,state:"open",body:"Obligation-ID: OBL-1\n"};
  const successor={number:43,state:"open",body:"Obligation-ID: OBL-1\nSupersedes: 42\n"};
  assert.equal(mayAutoCloseSupersededObligation({predecessor,successor}),true);
  assert.equal(mayAutoCloseSupersededObligation({
    predecessor,
    successor:{...successor,body:"Obligation-ID: OBL-2\nSupersedes: 42\n"}
  }),false);
  assert.equal(mayAutoCloseSupersededObligation({
    predecessor,
    successor:{...successor,body:"Obligation-ID: OBL-1\nSupersedes: none\n"}
  }),false);
});


test("selects only nonterminal workflow runs for cancellation", () => {
  const runs=[
    {id:1,status:"queued"},
    {id:2,status:"in_progress"},
    {id:3,status:"waiting"},
    {id:4,status:"requested"},
    {id:5,status:"pending"},
    {id:6,status:"completed"},
    {id:7,status:"completed",conclusion:"failure"}
  ];
  assert.deepEqual(cancellableWorkflowRuns(runs).map(x=>x.id),[1,2,3,4,5]);
});
