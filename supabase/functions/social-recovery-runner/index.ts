import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// Protected-main promotion bootstrap: social provider-truth contract v1.

const SOCIAL_CHANNELS = ["linkedin_personal", "linkedin_company", "instagram_company"] as const;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
});
const clean = (value: unknown) => String(value ?? "").trim();
const todayAmsterdam = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());

function apiBase(base: string) {
  return base.replace(/\/$/, "");
}

function dataHeaders(service: string, jsonBody = false) {
  return {
    "apikey": service,
    "authorization": `Bearer ${service}`,
    ...(jsonBody ? { "content-type": "application/json" } : {}),
  };
}

async function dataApiJson(base: string, service: string, pathOrUrl: string, init: RequestInit = {}) {
  const target = /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : apiBase(base) + pathOrUrl;
  const response = await fetch(target, {
    ...init,
    headers: {
      ...dataHeaders(service, Boolean(init.body)),
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(10_000),
  });
  const text = await response.text();
  let body: any = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }
  if (!response.ok) {
    throw new Error(`SUPABASE_DATA_API_${response.status}:${clean(typeof body === "string" ? body : body?.message || body?.error || "") .slice(0, 120)}`);
  }
  return body;
}

async function schedulerToken(base: string, service: string) {
  const body = await dataApiJson(base, service, "/rest/v1/rpc/bg_geheim", {
    method: "POST",
    body: JSON.stringify({ p_naam: "powerhouse_daily_scheduler_token" }),
  });
  if (typeof body === "string") return clean(body);
  if (Array.isArray(body)) {
    const first = body[0];
    return clean(typeof first === "string" ? first : first?.token ?? first?.bg_geheim ?? first?.value);
  }
  return clean(body?.token ?? body?.bg_geheim ?? body?.value);
}

async function readCanonicalState(base: string, service: string, runDate: string) {
  const decisionsUrl = new URL(apiBase(base) + "/rest/v1/powerhouse_channel_decisions");
  decisionsUrl.searchParams.set("select", "channel,decision,state,delivery_ref,delivery_evidence,updated_at");
  decisionsUrl.searchParams.set("run_date", `eq.${runDate}`);
  decisionsUrl.searchParams.set("channel", "in.(linkedin_personal,linkedin_company,instagram_company)");
  decisionsUrl.searchParams.set("order", "channel.asc");

  const obligationsUrl = new URL(apiBase(base) + "/rest/v1/content_publication_obligations");
  obligationsUrl.searchParams.set("select", "channel,status,external_id,evidence,last_error,next_action,updated_at");
  obligationsUrl.searchParams.set("tenant_id", "eq.canonical");
  obligationsUrl.searchParams.set("publication_date", `eq.${runDate}`);
  obligationsUrl.searchParams.set("channel", "in.(linkedin_personal,linkedin_company,instagram)");
  obligationsUrl.searchParams.set("order", "channel.asc");

  const [decisions, obligations] = await Promise.all([
    dataApiJson(base, service, decisionsUrl.toString()),
    dataApiJson(base, service, obligationsUrl.toString()),
  ]);
  return {
    decisions: Array.isArray(decisions) ? decisions : [],
    obligations: Array.isArray(obligations) ? obligations : [],
  };
}

async function invokeFunction(base: string, token: string, name: string, payload: unknown, timeoutMs: number) {
  try {
    const response = await fetch(base + "/functions/v1/" + name, {
      method: "POST",
      headers: { "content-type": "application/json", "x-powerhouse-token": token },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const body = await response.json().catch(() => ({}));
    return { ok: response.ok && body?.ok !== false, http: response.status, body, timed_out: false };
  } catch (error) {
    const detail = clean((error as Error)?.name || (error as Error)?.message || error).slice(0, 100);
    return { ok: false, http: 0, body: {}, timed_out: detail.toLowerCase().includes("timeout"), error: "FUNCTION_TRANSPORT_UNAVAILABLE", detail };
  }
}

function safeDecision(d: any) {
  return {
    channel: d?.channel || null,
    decision: d?.decision || null,
    state: d?.state || null,
    delivery_ref: d?.delivery_ref || null,
    updated_at: d?.updated_at || null,
    error: d?.delivery_evidence?.error || null,
    provider: d?.delivery_evidence?.provider || null,
    provider_truth_verified: d?.delivery_evidence?.provider_truth_verified === true,
    capability_state: d?.delivery_evidence?.capability_state || null,
  };
}

function safeObligation(o: any) {
  return {
    channel: o?.channel || null,
    status: o?.status || null,
    external_id: o?.external_id || null,
    last_error: o?.last_error || null,
    next_action: o?.next_action || null,
    updated_at: o?.updated_at || null,
    provider: o?.evidence?.provider || null,
    provider_truth_verified: o?.evidence?.provider_truth_verified === true,
    provider_create_success: o?.evidence?.provider_create_success === true,
    provider_publication_ack_verified: o?.evidence?.provider_publication_ack_verified === true,
    readback_permission_limited: o?.evidence?.readback_permission_limited === true,
    republish_forbidden: o?.evidence?.republish_forbidden === true,
  };
}

function providerSideEffectTruthHealthy(channel: string, obligation: any) {
  if (obligation?.provider_truth_verified === true) return true;
  return channel === "linkedin_personal"
    && obligation?.provider_create_success === true
    && obligation?.provider_publication_ack_verified === true
    && obligation?.readback_permission_limited === true
    && obligation?.republish_forbidden === true
    && !!clean(obligation?.external_id);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ ok: false, error: "POST_ONLY" }, 405);

  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const url = Deno.env.get("SUPABASE_URL") || "";
  if (!service || !url) return json({ ok: false, error: "CONFIG" }, 500);
  if (bearer(req) !== service) return json({ ok: false, error: "SERVICE_ROLE_REQUIRED" }, 403);

  const body = await req.json().catch(() => ({}));
  const runDate = clean(body?.runDate) || todayAmsterdam();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(runDate)) return json({ ok: false, error: "INVALID_DATE" }, 400);
  if (runDate !== todayAmsterdam()) return json({ ok: false, error: "SAME_DAY_RECOVERY_ONLY", runDate }, 409);

  let token = "";
  try {
    token = await schedulerToken(url, service);
  } catch (error) {
    console.error("SOCIAL_RECOVERY_DATA_API_AUTH_FAILED", clean((error as Error)?.message || error).slice(0, 160));
    return json({ ok: false, error: "SCHEDULER_TOKEN_UNAVAILABLE" }, 503);
  }
  if (!token) return json({ ok: false, error: "SCHEDULER_TOKEN_EMPTY" }, 503);

  let initialReadback: any;
  try {
    initialReadback = await readCanonicalState(url, service, runDate);
  } catch (error) {
    console.error("SOCIAL_RECOVERY_INITIAL_READBACK_FAILED", clean((error as Error)?.message || error).slice(0, 160));
    return json({ ok: false, runDate, error: "CANONICAL_READBACK_UNAVAILABLE" }, 503);
  }

  const initialDecisions = (initialReadback.decisions || []).map(safeDecision);
  const initialRequired = initialDecisions.filter((d: any) => SOCIAL_CHANNELS.includes(d.channel) && d.decision === "publish");
  const preparationNeeded = initialRequired.some((d: any) => {
    const state = clean(d.state);
    return !["published", "scheduled", "content_ready"].includes(state);
  });

  const loop = preparationNeeded
    ? await invokeFunction(url, token, "powerhouse-content-loop", { runDate }, 60_000)
    : { ok: true, http: 204, body: { reason: "CANONICAL_CONTENT_ALREADY_READY_OR_TERMINAL" }, timed_out: false, skipped: true, error: null };
  const degradedPreparation = preparationNeeded && !loop.ok;
  if (degradedPreparation) {
    console.error("SOCIAL_RECOVERY_PREPARATION_DEGRADED", loop.http, loop.timed_out);
  }

  let postPreparation: any;
  try {
    postPreparation = await readCanonicalState(url, service, runDate);
  } catch (error) {
    console.error("SOCIAL_RECOVERY_POST_PREPARATION_READBACK_FAILED", clean((error as Error)?.message || error).slice(0, 160));
    return json({ ok: false, runDate, degraded_preparation: degradedPreparation, error: "CANONICAL_READBACK_UNAVAILABLE" }, 503);
  }

  const publishable = (postPreparation.decisions || [])
    .map(safeDecision)
    .filter((d: any) => SOCIAL_CHANNELS.includes(d.channel) && d.decision === "publish" && clean(d.state) === "content_ready")
    .map((d: any) => clean(d.channel));

  const fallback = await Promise.all(publishable.map(async (channel: string) => {
    const result = await invokeFunction(
      url,
      token,
      "powerhouse-social-publisher",
      { runDate, mode: "publish_only", channels: [channel] },
      40_000,
    );
    return {
      channel,
      ok: result.ok,
      http: result.http,
      timed_out: result.timed_out,
      error: result.ok ? null : (result.error || clean(result.body?.error) || "PUBLISH_ONLY_FAILED"),
    };
  }));

  let readback: any;
  try {
    readback = await readCanonicalState(url, service, runDate);
  } catch (error) {
    console.error("SOCIAL_RECOVERY_DATA_API_READBACK_FAILED", clean((error as Error)?.message || error).slice(0, 160));
    return json({
      ok: false,
      runDate,
      degraded_preparation: degradedPreparation,
      fallback,
      error: "CANONICAL_READBACK_UNAVAILABLE",
    }, 503);
  }

  const decisions = (readback.decisions || []).map(safeDecision);
  const obligations = (readback.obligations || []).map(safeObligation);
  const required = decisions.filter((d: any) => SOCIAL_CHANNELS.includes(d.channel) && d.decision === "publish");
  const unresolved = required.filter((d: any) => !["published", "scheduled"].includes(clean(d.state)));
  const providerTruthVerified = required.reduce((count: number, d: any) => {
    const obligationChannel = clean(d.channel) === "instagram_company" ? "instagram" : clean(d.channel);
    const obligation = obligations.find((o: any) => clean(o.channel) === obligationChannel);
    return count + (obligation?.provider_truth_verified === true ? 1 : 0);
  }, 0);
  const providerTruthAccepted = required.reduce((count: number, d: any) => {
    const obligationChannel = clean(d.channel) === "instagram_company" ? "instagram" : clean(d.channel);
    const obligation = obligations.find((o: any) => clean(o.channel) === obligationChannel);
    return count + (providerSideEffectTruthHealthy(clean(d.channel), obligation) ? 1 : 0);
  }, 0);
  const providerTruthHealthy = required.length > 0 && required.every((d: any) => {
    const obligationChannel = clean(d.channel) === "instagram_company" ? "instagram" : clean(d.channel);
    const obligation = obligations.find((o: any) => clean(o.channel) === obligationChannel);
    if (!obligation) return false;
    const status = clean(obligation.status).toUpperCase();
    return ["PUBLISHED", "DISPATCHED", "LIVE_PROVEN"].includes(status)
      && providerSideEffectTruthHealthy(clean(d.channel), obligation)
      && !!clean(obligation.external_id);
  });
  const recovered = required.length > 0 && unresolved.length === 0 && providerTruthHealthy;

  const response = {
    ok: recovered,
    runDate,
    loop_state: recovered ? "GREEN" : "AMBER",
    truth_contract: "RECOVERY GREEN REQUIRES CANONICAL STATE AND PROVIDER SIDE-EFFECT TRUTH",
    degraded_preparation: degradedPreparation,
    content_loop: {
      ok: loop.ok,
      http: loop.http,
      timed_out: loop.timed_out,
      skipped: loop.skipped === true,
      preparation_needed: preparationNeeded,
      loop_state: loop.body?.loop_state || null,
      error: loop.ok ? null : (loop.error || clean(loop.body?.error) || "CONTENT_LOOP_FAILED"),
    },
    fallback,
    providerTruthVerified,
    providerTruthAccepted,
    providerTruthHealthy,
    required_publish_count: required.length,
    unresolved,
    obligations,
    decisions,
  };
  return json(response, recovered ? 200 : 409);
});
