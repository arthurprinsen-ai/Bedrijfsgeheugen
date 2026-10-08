import { project, mergedExtra } from "./notion-contact-projection.mjs";

export async function authenticNotionPayload(body, header, token) {
  if (!token || !/^sha256=[a-f0-9]{64}$/i.test(header || "")) return false;
  const signature = (header || "").slice(7).match(/../g)?.map(x => parseInt(x, 16));
  if (!signature || signature.length !== 32) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(token), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  return crypto.subtle.verify("HMAC", key, new Uint8Array(signature), new TextEncoder().encode(body));
}

export async function handleNotionContactWebhook(req, db, notionToken, notionRequest) {
  const response = (payload, code = 200) => new Response(JSON.stringify(payload), {
    status: code, headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
  if (req.method !== "POST") return response({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
  const raw = await req.text();
  if (raw.length > 65536) return response({ ok: false, code: "PAYLOAD_TOO_LARGE" }, 413);
  const { data: storedToken, error: vaultError } = await db.rpc("bg_geheim", { p_naam: "NOTION_WEBHOOK_VERIFICATION_TOKEN" });
  if (vaultError || typeof storedToken !== "string" || !storedToken) return response({ ok: false, code: "WEBHOOK_SUBSCRIPTION_SETUP_REQUIRED" }, 503);
  if (!await authenticNotionPayload(raw, req.headers.get("x-notion-signature"), storedToken)) {
    return response({ ok: false, code: "INVALID_SIGNATURE" }, 401);
  }
  let event;
  try { event = JSON.parse(raw); } catch { return response({ ok: false, code: "INVALID_JSON" }, 400); }
  if (!event?.id || !["page.created", "page.properties_updated", "page.moved", "page.undeleted"].includes(event.type) ||
      event.entity?.type !== "page" || !/^[a-f0-9-]{36}$/i.test(event.entity.id || "")) {
    return response({ ok: true, status: "IGNORED_EVENT" });
  }
  const page = await notionRequest(notionToken, "/pages/" + encodeURIComponent(event.entity.id));
  const candidate = project(page);
  if (!candidate) return response({ ok: true, status: "IGNORED_NON_CORE_OR_INVALID" });
  const { data: rows, error: readError } = await db.from("bg_connecties")
    .select("sleutel,extra,bijgewerkt_op").eq("linkedin_url", candidate.linkedin_url).limit(2);
  if (readError) throw readError;
  if (!rows?.length) return response({ ok: true, status: "NOT_IN_CANONICAL_CRM", matched: 0 });
  if (rows.length !== 1) return response({ ok: false, code: "AMBIGUOUS_CRM_IDENTITY" }, 409);
  const row = rows[0];
  const nextExtra = mergedExtra(row.extra, candidate.metadata);
  if (!nextExtra) return response({ ok: true, status: "UNCHANGED_OR_CONFLICT" });
  let query = db.from("bg_connecties").update({ extra: nextExtra, bijgewerkt_op: new Date().toISOString() })
    .eq("sleutel", row.sleutel);
  if (row.bijgewerkt_op) query = query.eq("bijgewerkt_op", row.bijgewerkt_op);
  else query = query.is("bijgewerkt_op", null);
  const { data: saved, error: writeError } = await query.select("sleutel");
  if (writeError) throw writeError;
  if (saved?.length !== 1) return response({ ok: false, code: "OPTIMISTIC_CONCURRENCY_RETRY" }, 409);
  await db.from("bg_notion_sync").insert({
    run_id: crypto.randomUUID(), wat: "connecties-kern-webhook",
    records_gesyncet: 1, status: "groen", fout: null, uitgevoerd_op: new Date().toISOString()
  });
  return response({ ok: true, status: "CANONICAL_METADATA_UPDATED", matched: 1, sent: 0 });
}
