import { createDeliveryPlan } from '../brain-delivery-system.mjs';
import { deriveRequiredTestSuites } from '../delivery-required-test-suites.mjs';

export const NETLIFY_GOVERNANCE_PREFIXES = Object.freeze([
  'docs/',
  '.agents/',
  'tests/',
  '.github/',
  'brain/learning/',
  'brain/policies/',
  'tools/delivery/',
  'tools/ci/',
]);

export const NETLIFY_GOVERNANCE_EXACT = Object.freeze(new Set([
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
  'brain/contracts/production-readback-v1.json',
]));

export const NETLIFY_RUNTIME_PREFIXES = Object.freeze([
  'netlify/functions/',
  'platform/api/',
  'platform/saas/',
  'platform/connectors/',
  'platform/read-models/',
]);

export const NETLIFY_BUILD_RUNTIME_EXACT = Object.freeze(new Set([
  'tools/netlify-build/run-netlify-build.mjs',
  'tools/netlify-build/run-localized-routes-parallel.mjs',
  'tools/netlify-build/restamp-prebuilt-release.mjs',
]));

const unique = values => [...new Set((values || []).map(value => String(value).trim()).filter(Boolean))];

export function deriveNetlifyDeploymentApplicability({
  changedPaths=[],
  headSha,
  policy,
  forceDeployment=false,
  forceBrowser=false,
  skipDeployment=false,
}={}) {
  const changed=unique(changedPaths);
  const runtimeChangedPaths=changed.filter(path =>
    NETLIFY_BUILD_RUNTIME_EXACT.has(path) || (
      !NETLIFY_GOVERNANCE_EXACT.has(path) &&
      !NETLIFY_GOVERNANCE_PREFIXES.some(prefix => path.startsWith(prefix))
    )
  );

  if(skipDeployment){
    return Object.freeze({
      changedPaths:Object.freeze(changed),
      runtimeChangedPaths:Object.freeze(runtimeChangedPaths),
      deliveryLanes:Object.freeze([]),
      requiredSuites:deriveRequiredTestSuites({lanes:[]}),
      websiteRequired:false,
      portalRequired:false,
      browserRequired:false,
      netlifyRuntimeRequired:false,
      deploymentRequired:false,
      reason:'explicit-no-deploy',
    });
  }

  const plan=runtimeChangedPaths.length
    ? createDeliveryPlan({changedPaths:runtimeChangedPaths,headSha,policy})
    : {lanes:[]};
  const deliveryLanes=plan.lanes.map(lane => lane.id);
  const requiredSuites=deriveRequiredTestSuites({lanes:deliveryLanes});
  const websiteRequired=requiredSuites.website === true;
  const portalRequired=requiredSuites.portal === true;
  const browserRequired=forceBrowser || websiteRequired || portalRequired;
  const netlifyRuntimeRequired=runtimeChangedPaths.some(path =>
    NETLIFY_RUNTIME_PREFIXES.some(prefix => path.startsWith(prefix))
  );
  const netlifyBuildRuntimeRequired=runtimeChangedPaths.some(path => NETLIFY_BUILD_RUNTIME_EXACT.has(path));
  const deploymentRequired=forceDeployment || browserRequired || netlifyRuntimeRequired || netlifyBuildRuntimeRequired;

  return Object.freeze({
    changedPaths:Object.freeze(changed),
    runtimeChangedPaths:Object.freeze(runtimeChangedPaths),
    deliveryLanes:Object.freeze(deliveryLanes),
    requiredSuites,
    websiteRequired,
    portalRequired,
    browserRequired,
    netlifyRuntimeRequired,
    netlifyBuildRuntimeRequired,
    deploymentRequired,
    reason:deploymentRequired?'netlify-impact':'non-netlify-impact',
  });
}
