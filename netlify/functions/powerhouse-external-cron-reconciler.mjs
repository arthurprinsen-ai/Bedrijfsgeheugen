// Independent of PostgreSQL pg_cron. No provider messages or outreach are sent here.
export default async () => {
  const url = process.env.BG_PORTAL_EU_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  const recoveryToken = process.env.SUPABASE_RECOVERY_TOKEN;
  if (!url || !key || !recoveryToken) throw new Error("RECOVERY_CONFIG_MISSING");
  const endpoint = new URL("/rest/v1/rpc/powerhouse_external_cron_reconcile_v1", url);
  if (endpoint.protocol !== "https:") throw new Error("HTTPS_REQUIRED");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 18000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": key, "Authorization": `Bearer ${key}` },
      body: JSON.stringify({ p_token: recoveryToken }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`RECONCILE_HTTP_${response.status}`);
    const result = await response.json();
    if (!Number.isInteger(result) || result < 0) throw new Error("RECONCILE_INVALID_RESPONSE");
    console.log(JSON.stringify({ event: "cron_reconcile_ok", recorded: result }));
  } finally {
    clearTimeout(timer);
  }
};
export const config = { schedule: "*/15 * * * *" };
