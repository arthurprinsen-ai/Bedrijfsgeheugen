import test from "node:test";
import assert from "node:assert/strict";
import { deriveReleaseStatus } from "../tools/netlify/release-status.mjs";

const greenGitHub = { merged: true, requiredChecks: "passed" };
test("intentional skip is neutral, not failure", () => {
  assert.deepEqual(deriveReleaseStatus({
    github: greenGitHub, deployment: { required: false, reason: "docs-only" },
  }), {
    githubRelease: "passed", netlifyDeployment: "not_required",
    productionReadback: "not_required", overall: "passed",
    deploymentRequired: false, reason: "docs-only",
  });
});
test("deploy required but not started is pending", () => {
  const r = deriveReleaseStatus({github:greenGitHub, deployment:{required:true}});
  assert.equal(r.netlifyDeployment,"pending"); assert.equal(r.overall,"pending");
});
test("successful deployment without verified production readback is pending", () => {
  const r = deriveReleaseStatus({github:greenGitHub, deployment:{required:true,state:"success"}});
  assert.equal(r.productionReadback,"pending"); assert.equal(r.overall,"pending");
});
test("matching fresh provider readback is green", () => {
  const r=deriveReleaseStatus({github:greenGitHub,deployment:{required:true,state:"success"},
    production:{checked:true,fresh:true,matchesExpectedRelease:true}});
  assert.equal(r.overall,"passed");
});
test("stale readback cannot pass",()=>{
  const r=deriveReleaseStatus({github:greenGitHub,deployment:{required:true,state:"success"},
    production:{checked:true,fresh:false,matchesExpectedRelease:true}});
  assert.equal(r.productionReadback,"pending");
});
test("unknown deployment requirement is never treated as a skip",()=>{
  const r=deriveReleaseStatus({github:greenGitHub,deployment:{}});
  assert.equal(r.netlifyDeployment,"unknown"); assert.equal(r.overall,"pending");
});
test("explicit production mismatch is failure",()=>{
  const r=deriveReleaseStatus({github:greenGitHub,deployment:{required:true,state:"success"},
    production:{checked:true,fresh:true,matchesExpectedRelease:false}});
  assert.equal(r.productionReadback,"failed");assert.equal(r.overall,"failed");
});
test("github required-check failure blocks release",()=>{
  const r=deriveReleaseStatus({github:{merged:false,requiredChecks:"failed"},deployment:{required:false}});
  assert.equal(r.githubRelease,"failed");assert.equal(r.overall,"failed");
});
