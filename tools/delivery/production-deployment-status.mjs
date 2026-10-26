import { deriveNetlifyDeploymentApplicability } from './netlify-deployment-applicability.mjs';

export function classifyProductionDeployment({ mainSha, deployedSha, deployId, context, changedPaths, policy, comparisonStatus, comparisonComplete=true }) {
  if (!/^[a-f0-9]{40}$/.test(mainSha || '')) return { state:'UNKNOWN', reason:'invalid-main-sha' };
  if (!/^[a-f0-9]{40}$/.test(deployedSha || '') || !deployId || context !== 'production') {
    return { state:'UNKNOWN', reason:'unverified-production-identity', mainSha, deployedSha:deployedSha || null };
  }
  if (deployedSha === mainSha) return { state:'PRODUCTION_VERIFIED', mainSha, deployedSha, deployId };
  if (!comparisonComplete || comparisonStatus !== 'ahead' || !Array.isArray(changedPaths)) {
    return { state:'UNKNOWN', reason:'incomplete-or-divergent-comparison', mainSha, deployedSha, deployId };
  }
  const applicability=deriveNetlifyDeploymentApplicability({ changedPaths, headSha:mainSha, policy });
  return {
    state:applicability.deploymentRequired ? 'DEPLOY_REQUIRED' : 'DEPLOY_NOT_REQUIRED',
    reason:applicability.reason,
    mainSha, deployedSha, deployId,
    changedPaths, runtimeChangedPaths:applicability.runtimeChangedPaths,
  };
}
