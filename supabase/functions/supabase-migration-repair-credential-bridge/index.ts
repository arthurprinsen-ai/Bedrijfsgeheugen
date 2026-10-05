import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.9.6";

const issuer = "https://token.actions.githubusercontent.com";
const audience = "bedrijfsgeheugen-supabase-migration-repair-3742";
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

    const dbUrl = Deno.env.get("SUPABASE_DB_URL") || "";
    if (!/^postgres(?:ql)?:\/\//i.test(dbUrl)) {
      return new Response("database transport unavailable", { status: 503 });
    }

    return Response.json(
      { db_url: dbUrl, scope: "migration-repair-3742", expires_with_job: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return new Response("unauthorized", { status: 401 });
  }
});
