/**
 * Release status contract.
 * Never mark an intentionally skipped deploy as a failed deploy.
 * Inputs must be grounded in provider readbacks (not assumed from CI success).
 */
export function deriveReleaseStatus(input) {
  const github = input?.github ?? {};
  const deployment = input?.deployment ?? {};
  const production = input?.production ?? {};
  const release = github.merged === true && github.requiredChecks === "passed"
    ? "passed"
    : github.requiredChecks === "failed" || github.mergeState === "failed"
      ? "failed" : "pending";
  const required = deployment.required;
  const deploy = required === false
    ? "not_required"
    : required !== true
      ? "unknown"
      : deployment.state === "success"
        ? "passed"
        : deployment.state === "failed"
          ? "failed" : "pending";
  // A fresh readback must explicitly match the expected production release.
  const verified = production.checked === true
    && production.fresh === true
    && production.matchesExpectedRelease === true;
  const readback = required === false
    ? "not_required"
    : required !== true
      ? "unknown"
      : verified ? "passed"
        : production.checked === true && production.fresh === true && production.matchesExpectedRelease === false
          ? "failed" : "pending";
  const overall = release === "failed" || deploy === "failed" || readback === "failed"
    ? "failed"
    : release === "passed" && (
        (deploy === "not_required" && readback === "not_required")
        || (deploy === "passed" && readback === "passed"))
      ? "passed"
      : "pending";
  return {
    githubRelease: release,
    netlifyDeployment: deploy,
    productionReadback: readback,
    overall,
    deploymentRequired: required === true,
    reason: required === false
      ? deployment.reason || "No deployable production change"
      : null,
  };
}
