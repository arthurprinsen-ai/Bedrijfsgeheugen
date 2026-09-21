import { syncComposioSecret } from './powerhouse-composio-secret-sync.mjs';

export default {
  async deploySucceeded(event) {
    if (event?.deploy?.context !== 'production') return;
    await syncComposioSecret();
  }
};
