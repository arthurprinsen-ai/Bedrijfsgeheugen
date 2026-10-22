// One existing Main Write Integrity workflow. Retry only its immutable API read.
export const MAIN_WRITE_ASSOCIATION_DELAYS_MS = Object.freeze([500, 1500]);
export async function readMainWritePullRequests({
  read, wait = ms => new Promise(resolve => setTimeout(resolve, ms)),
  delaysMs = MAIN_WRITE_ASSOCIATION_DELAYS_MS,
} = {}) {
  if (typeof read !== 'function' || typeof wait !== 'function' ||
      !Array.isArray(delaysMs) || delaysMs.some(n => !Number.isInteger(n) || n < 0)) {
    throw new TypeError('Invalid association retry inputs');
  }
  const maxAttempts = Math.min(4, delaysMs.length + 1);
  let previousError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const prs = await read();
      if (!Array.isArray(prs) || prs.some(pr => !pr || !Number.isInteger(pr.number) || pr.number <= 0))
        throw new TypeError('Invalid PR association provider response');
      previousError = null;
      if (prs.length) return { pullRequests: prs, attempts: attempt, status: 'ASSOCIATIONS_RETURNED' };
      if (attempt === maxAttempts)
        return { pullRequests: [], attempts: attempt, status: 'NO_ASSOCIATION_AFTER_RECHECK' };
    } catch (error) {
      previousError = String(error?.message || error).slice(0, 300);
    }
    if (attempt < maxAttempts) await wait(delaysMs[attempt - 1]);
  }
  return { pullRequests: undefined, attempts: maxAttempts,
    status: 'ASSOCIATION_PROVIDER_UNAVAILABLE', error: previousError };
}
