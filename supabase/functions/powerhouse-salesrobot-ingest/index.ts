import { createClient } from "npm:@supabase/supabase-js@2";

// Inbound-only adapter. It never sends messages, creates prospects or updates contact status.
const CAMPAIGN_ID = "ae2812ad-c3eb-4c90-a0d4-6d4e5a94b93e";
const CAMPAIGN_NAME = "Bedrijfsgeheugen";
const MAX_BYTES = 65536;
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});
const str = (v) => (typeof v === "string" || typeof v === "number" ? String(v).trim() : "");
const first = (items, names) => {
  for (const obj of items) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) continue;
    for (const name of names) {
      const value = str(obj[name]);
      if (value) return value;
    }
  }
  return "";
};
const scopes = (body) => {
  const found = [body, body?.data, body?.payload, body?.eventData];
  for (const obj of [...found]) {
    if (obj && typeof obj === "object") {
      found.push(obj.prospect, obj.contact, obj.lead, obj.person, obj.message, obj.chat, obj.conversation);
    }
  }
  return found;
};
const digest = async (data) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",
  new TextEncoder().encode(data)))).map(x => x.toString(16).padStart(2, "0")).join("");
const constantEqual = (a, b) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};
const linkedinProfile = (raw) => {
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (!["linkedin.com", "www.linkedin.com", "nl.linkedin.com"].includes(url.hostname.toLowerCase())) return "";
    if (!/^\/in\/[A-Za-z0-9%_.-]+\/?$/.test(url.pathname)) return "";
    return "https://www.linkedin.com" + url.pathname.replace(/\/$/, "");
  } catch { return ""; }
};
const safeDate = (value) => {
  if (!value) return new Date().toISOString();
  const ms = /^\d{10,13}$/.test(value) ? Number(value) * (value.length === 10 ? 1000 : 1) : Date.parse(value);
  if (!Number.isFinite(ms) || ms > Date.now() + 86400000 || ms < Date.now() - 365 * 86400000)
    return new Date().toISOString();
  return new Date(ms).toISOString();
};

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const secretInput = url.searchParams.get("token") || req.headers.get("x-salesrobot-webhook-token") || "";
  if (req.method !== "GET" && req.method !== "POST") return json({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
  if (!/^[0-9a-f]{64}$/.test(secretInput)) return json({ ok: false, error: "UNAUTHORIZED" }, 401);
  const dbUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!dbUrl || !serviceKey) return json({ ok: false, error: "SERVER_CONFIG" }, 503);
  const db = createClient(dbUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: expected, error: secretError } = await db.rpc("bg_geheim", { p_naam: "salesrobot_webhook_ingress_token" });
  if (secretError || typeof expected !== "string" || !constantEqual(secretInput, expected))
    return json({ ok: false, error: "UNAUTHORIZED" }, 401);

  if (url.searchParams.get("event") !== "contact_replies")
    return json({ ok: false, error: "UNSUPPORTED_EVENT" }, 422);
  if (req.method === "GET") return json({ ok: true, receiver: "salesrobot", event: "contact_replies", mode: "inbound_only" });

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) return json({ ok: false, error: "JSON_REQUIRED" }, 415);
  const bodyLength = Number(req.headers.get("content-length") || 0);
  if (bodyLength > MAX_BYTES) return json({ ok: false, error: "PAYLOAD_TOO_LARGE" }, 413);
  const raw = await req.text();
  if (new TextEncoder().encode(raw).length > MAX_BYTES) return json({ ok: false, error: "PAYLOAD_TOO_LARGE" }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ ok: false, error: "INVALID_JSON" }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ ok: false, error: "INVALID_PAYLOAD" }, 422);

  // Authenticated non-persistent canary: no synthetic CRM/provider event.
  if (body._powerhouse_probe === true && req.headers.get("x-powerhouse-probe") === "1")
    return json({ ok: true, probe: true, persisted: false, external_side_effects: false });

  const nodes = scopes(body);
  const incomingCampaignId = first(nodes, ["campaignUuid", "campaignUUID", "campaignId", "campaign_id"]);
  const incomingCampaignName = first(nodes, ["campaignName", "campaign_name"]);
  if ((incomingCampaignId && incomingCampaignId !== CAMPAIGN_ID) ||
      (incomingCampaignName && incomingCampaignName !== CAMPAIGN_NAME))
    return json({ ok: false, error: "WRONG_CAMPAIGN" }, 409);

  const profileUrl = linkedinProfile(first(nodes,
    ["profileUrl", "profileURL", "profile_url", "linkedinUrl", "linkedinURL", "linkedin_url", "linkedinProfileUrl", "linkedInUrl"]));
  const prospectId = first(nodes, ["prospectUuid", "prospectUUID", "prospect_id", "prospectId"]);
  const providerMessageId = first(nodes, ["messageId", "message_id", "replyId", "reply_id"]);
  const providerEventId = first(nodes, ["eventId", "event_id", "webhookEventId"]);
  const replyBody = first(nodes, ["replyText", "reply_text", "messageText", "message_text", "message", "text", "body"]).slice(0, 4000);
  const providerTimestamp = first(nodes, ["eventTime", "event_time", "occurredAt", "timestamp", "createdAt", "created_at"]);
  const canonical = (profileUrl || prospectId) || "";
  const fingerprint = providerEventId ? "event:" + providerEventId
    : providerMessageId ? "message:" + providerMessageId
    : "payload:" + await digest(raw);
  const key = "salesrobot:" + CAMPAIGN_ID + ":contact_replies:" + await digest(fingerprint);
  let matched = null;
  if (profileUrl) {
    const versions = [profileUrl, profileUrl + "/", profileUrl.replace("www.linkedin.com", "linkedin.com")];
    const { data, error } = await db.from("bg_connecties")
      .select("sleutel,linkedin_url,bedrijf").in("linkedin_url", versions).limit(2);
    if (error) return json({ ok: false, error: "CONTACT_LOOKUP_FAILED" }, 503);
    if (data?.length === 1) matched = data[0];
  }
  const payloadDigest = await digest(raw);
  const { data, error } = await db.from("powerhouse_runtime_events").upsert({
    dedupe_key: key,
    event_type: "salesrobot_contact_replies",
    source: "salesrobot_webhook",
    subject_key: canonical || "salesrobot:unmatched:" + payloadDigest.slice(0, 24),
    person_key: matched?.sleutel || matched?.linkedin_url || null,
    company_key: null,
    channel: "linkedin_dm",
    campaign_key: CAMPAIGN_ID,
    occurred_at: safeDate(providerTimestamp),
    evidence: {
      provider: "salesrobot",
      event: "contact_replies",
      authentication: "vault_backed_shared_callback_secret",
      provider_event_id: providerEventId || null,
      provider_message_id: providerMessageId || null,
      prospect_uuid: prospectId || null,
      linkedin_url: profileUrl || null,
      reply_text: replyBody || null,
      payload_sha256: payloadDigest,
      signed_provider_payload: false,
      delivery_claim: false
    },
    context: {
      campaign_name: CAMPAIGN_NAME,
      campaign_id: CAMPAIGN_ID,
      crm_identity_resolved: Boolean(matched),
      raw_event_name: first(nodes, ["eventType", "event_type", "type", "event"]) || null,
      next_action: matched ? "match_existing_sales_action_and_review_reply" : "resolve_prospect_identity"
    },
    state: "observed",
    data_quality: matched ? "OBSERVED" : "UNRESOLVED_IDENTITY",
    confidence: matched ? 0.8 : 0.5
  }, { onConflict: "dedupe_key", ignoreDuplicates: true }).select("event_id").maybeSingle();
  if (error) return json({ ok: false, error: "CANONICAL_EVENT_WRITE_FAILED" }, 503);
  return json({
    ok: true, accepted: true, duplicate: !data, event_id: data?.event_id || null,
    matched_existing_contact: Boolean(matched), delivery_claim: false
  });
});
