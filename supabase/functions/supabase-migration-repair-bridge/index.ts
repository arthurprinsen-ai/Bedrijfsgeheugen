import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.9.6";

const issuer = "https://token.actions.githubusercontent.com";
const audience = "bedrijfsgeheugen-supabase-migration-repair-bridge";
const jwks = createRemoteJWKSet(new URL(issuer + "/.well-known/jwks"));
const expectedRepo = "arthurprinsen-ai/Bedrijfsgeheugen";
const expectedRef = "refs/heads/main";
const expectedWorkflowRef =
  "arthurprinsen-ai/Bedrijfsgeheugen/.github/workflows/supabase-supported-migration-repair-3742.yml@refs/heads/main";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  try {
    const auth = req.headers.get("authorization") || "";
    if (!auth.startsWith("Bearer ")) return new Response("unauthorized", { status: 401 });

    const { payload } = await jwtVerify(auth.slice(7), jwks, { issuer, audience });
    if (
      payload.repository !== expectedRepo ||
      payload.ref !== expectedRef ||
      payload.workflow_ref !== expectedWorkflowRef
    ) {
      return new Response("forbidden", { status: 403 });
    }

    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch {}
    const expectedSha = String(body.expected_sha || "").trim();
    const tokenSha = String(payload.sha || "").trim();
    if (!/^[0-9a-f]{40}$/.test(expectedSha) || tokenSha !== expectedSha) {
      return new Response("sha mismatch", { status: 403 });
    }

    const dbUrl = Deno.env.get("SUPABASE_DB_URL") || "";
    if (!/^postgres(?:ql)?:\/\//.test(dbUrl)) throw new Error("database transport unavailable");

    return Response.json(
      { ok: true, db_url: dbUrl, project_ref: "adhjwmvyoixzjtmiroln" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return new Response("unauthorized", {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }
});
