const transientStatuses = new Set([429, 500, 502, 503, 504]);
const transientCodes = new Set(['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EAI_AGAIN', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_SOCKET']);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchWithBoundedRetry(url, {
  fetchImpl = fetch,
  sleepImpl = sleep,
  retries = 2,
  backoffMs = 250,
  options = { redirect: 'follow' }
} = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchImpl(url, options);
      if (!transientStatuses.has(response.status) || attempt === retries) return response;
      lastError = new Error(`transient HTTP ${response.status}`);
    } catch (error) {
      const code = error?.code || error?.cause?.code;
      if (!transientCodes.has(code) || attempt === retries) throw error;
      lastError = error;
    }
    await sleepImpl(backoffMs * (attempt + 1));
  }
  throw lastError || new Error(`fetch failed ${url}`);
}
