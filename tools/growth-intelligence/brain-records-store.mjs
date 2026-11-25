/** Adapter: ONE BRAIN-opslag (public.brain_records) voor de growth learning-store.
 * De fence-transactie draait volledig in Postgres (growth_insert_if_absent_with_cutover_fence);
 * deze adapter geeft het databaseantwoord ongewijzigd door en verzint zelf nooit een bevestiging.
 * `client` is een server-side Supabase-client met service-role; die wordt hier niet aangemaakt.
 */
const TENANT = 'bedrijfsgeheugen';

export function makeBrainRecordsStore(client) {
  if (!client || typeof client.rpc !== 'function' || typeof client.from !== 'function') {
    throw new Error('BRAIN_RECORDS_CLIENT_REQUIRED');
  }
  return {
    async get(key) {
      const { data, error } = await client.from('brain_records').select('payload')
        .eq('tenant_id', TENANT).eq('idempotency_key', key).maybeSingle();
      if (error) throw new Error('BRAIN_RECORDS_READ_FAILED');
      return data?.payload?.record;
    },
    async insertIfAbsentWithCutoverFence({ scope, legacyKey, key, record }) {
      const { data, error } = await client.rpc('growth_insert_if_absent_with_cutover_fence', {
        p_scope: scope, p_legacy_key: legacyKey, p_key: key, p_record: record,
      });
      if (error) throw new Error('BRAIN_RECORDS_FENCE_REJECTED:' + String(error.message || error.code || 'unknown'));
      return data;
    },
  };
}
