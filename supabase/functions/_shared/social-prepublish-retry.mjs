// Fail closed on all provider actions while the independent pre-publish reviewer is unavailable.
// HTTP 4xx identity/editorial denials remain hard blocks, except the retryable 429 rate limit.
const TRANSIENT_REVIEW_STATUSES = new Set([429, 500, 502, 503, 504]);

export function isTransientPrePublishReviewFailure(status) {
  return TRANSIENT_REVIEW_STATUSES.has(Number(status));
}
