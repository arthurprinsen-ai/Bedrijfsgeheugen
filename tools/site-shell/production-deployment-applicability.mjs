import { createDeliveryPlan } from '../brain-delivery-system.mjs';
import { deriveRequiredTestSuites } from '../delivery-required-test-suites.mjs';

export const PRODUCTION_DEPLOYMENT_GOVERNANCE_PREFIXES = Object.freeze([
  'docs/',
  '.agents/',
  'tests/',
  '.github/',
  'brain/learning/',
  'brain/policies/',
  'tools/delivery/',
  'tools/ci/',
]);

export const PRODUCTION_DEPLOYMENT_GOVERNANCE_EXACT = Object.freeze([
  'AGENTS.md',
  'config/delivery-prevention-rules.json',
  'config/powerhouse-agent-delivery-scheduler-v1.json',
  'platform/system-map/canonical-system-map.mjs',
  'tools/brain-delivery-system.mjs',
  'site/website-release-risk.json',
  'tools/site-shell/verify-targeted-website-routes.mjs',
  'tools/site-shell/contracts.mjs',
  'tools/site-shell/test-shell-components.mjs',
  'tools/site-shell/live-contract.mjs',
  'tools/site-shell/test-live-contract.mjs',
  'tools/site-shell/production-supersession.mjs',
  'tools/site-shell/standalone-visibility-check.mjs',
  'tools/site-shell/production-deployment-applicability.mjs',
  'brain/contracts/production-readback-v1.json',
  'config/historical-terminal-reconciliation.json',
]);

export const NETLIFY_RUNTIME_PREFIXES = Object.freeze([
  'netlify/functions/',
  'platform/api/',
  'platform/saas/',
  'platform/connectors/',
  'platform/read-models/',
]);

const governanceExact = new Set(PRODUCTION_DEPLOYMENT_GOVERNANCE_EXACT);
const unique = values => [...new Set((values ?? []).map(value => String(value).trim()).filter(Boolean))].sort();

export function classifyProductionDeploymentApplicability({
  changedPaths = [],
  headSha,
  policy,
  manualDeploy = false,
  manualReadback = false,
} = {}) {
  const paths=unique(changedPaths);
  const runtimeChangedPaths=paths.filter(path =>
    !governanceExact.has(path) &&
    !PRODUCTION_DEPLOYMENT_GOVERNANCE_PREFIXES.some(prefix => path.startsWith(prefix))
  );
  const controlPlaneOnly=paths.length > 0 && runtimeChangedPaths.length === 0;
  const plan=runtimeChangedPaths.length
    ? createDeliveryPlan({changedPaths:runtimeChangedPaths,headSha,policy})
    : {lanes:[]};
  const deliveryLanes=plan.lanes.map(lane => lane.id);
  const requiredSuites=deriveRequiredTestSuites({lanes:deliveryLanes});
  const websiteRequired=!controlPlaneOnly && requiredSuites.website === true;
  const portalRequired=!controlPlaneOnly && requiredSuites.portal === true;
  const browserRequired=websiteRequired || portalRequired || Boolean(manualReadback);
  const netlifyRuntimeRequired=!controlPlaneOnly && runtimeChangedPaths.some(path =>
    NETLIFY_RUNTIME_PREFIXES.some(prefix => path.startsWith(prefix))
  );
  const deploymentRequired=Boolean(manualDeploy) || browserRequired || netlifyRuntimeRequired;
  return Object.freeze({
    changedPaths:Object.freeze(paths),
    runtimeChangedPaths:Object.freeze(runtimeChangedPaths),
    controlPlaneOnly,
    deliveryLanes:Object.freeze(deliveryLanes),
    requiredSuites:Object.freeze({...requiredSuites}),
    websiteRequired,
    portalRequired,
    browserRequired,
    netlifyRuntimeRequired,
    deploymentRequired,
  });
}
