export function visibilityRetryPolicy(baseUrl) {
  const isDeployPreview = String(baseUrl || '').includes('deploy-preview-');
  return {
    maxAttempts: isDeployPreview ? 5 : 3,
    retryDelayMs(attempt) {
      if (!Number.isInteger(attempt) || attempt < 1) throw new Error('attempt must be a positive integer');
      return isDeployPreview ? Math.min(4000, 1000 * attempt) : 750 * attempt;
    },
  };
}
