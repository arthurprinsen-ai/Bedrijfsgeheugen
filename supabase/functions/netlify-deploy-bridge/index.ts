
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.9.6";
import postgres from "npm:postgres@3.4.7";

const issuer = "https://token.actions.githubusercontent.com";
const audience = "bedrijfsgeheugen-netlify-deploy-bridge";
const jwks = createRemoteJWKSet(new URL(issuer + "/.well-known/jwks"), { timeoutDuration: 4000, cooldownDuration: 30000 });
const expectedRepo = "arthurprinsen-ai/Bedrijfsgeheugen";
const expectedRef = "refs/heads/main";
const expectedWorkflowRef =
  "arthurprinsen-ai/Bedrijfsgeheugen/.github/workflows/production-source-snapshot.yml@refs/heads/main";
const siteId = "fd527056-493a-4d8a-8125-d00370104fa3";

async function getVaultSecret(name: string) {
  const dbUrl = Deno.env.get("SUPABASE_DB_URL") || "";
  if (!dbUrl) throw new Error("database auth unavailable");
  const sql = postgres(dbUrl, {
    max: 1,
    prepare: false,
    connect_timeout: 3,
    idle_timeout: 1,
    max_lifetime: 30,
  });
  try {
    const rows = await Promise.race([
      sql.unsafe("select decrypted_secret from vault.decrypted_secrets where name = $1 order by created_at desc limit 1", [name]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("vault read timeout")), 4000)
      ),
    ]);
    const value = (rows as any)?.[0]?.decrypted_secret;
    if (typeof value !== "string" || !value.trim()) throw new Error("secret unavailable: " + name);
    return value.trim();
  } finally {
    try { await sql.end({ timeout: 1 }); } catch {}
  }
}

async function getProxy() {
  const apiKey = await getVaultSecret("COMPOSIO_API_KEY");
  const endpoint = "https://backend.composio.dev/api/v3.1/tools/execute/NETLIFY_MCP_NETLIFY_DEPLOY_SERVICES_UPDATER";
  const payload = {
    connected_account_id: "netlify_mcp_retax-divide",
    version: "latest",
    arguments: {
      selectSchema: {
        operation: "deploy-site",
        params: { siteId },
        aiAgentName: "Powerhouse GitHub OIDC deploy bridge",
        llmModelName: "gpt-5.6",
      },
    },
  };
  const out = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "user-agent": "bedrijfsgeheugen-oidc-netlify-bridge/5",
    },
    body: JSON.stringify(payload),
  });
  const raw = await out.text();
  if (!out.ok) throw new Error("composio netlify authority " + out.status);
  const match = raw.match(/https:\/\/netlify-mcp\.netlify\.app\/proxy\/[A-Za-z0-9._~-]+/);
  if (!match) throw new Error("fresh netlify proxy not issued");
  return match[0];
}
const safe=(x:any)=>({
  id:x?.id||null,state:x?.state||null,done:x?.done??null,error:x?.error||null,
  error_message:x?.error_message||null,deploy_id:x?.deploy_id||null,build_id:x?.build_id||null,
  branch:x?.branch||null,context:x?.context||null,created_at:x?.created_at||null,updated_at:x?.updated_at||null,
  title:x?.title||null,message:String(x?.message||x?.msg||"").slice(0,500)
});

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  let phase = "request";
  const startedAt = Date.now();
  try {
    console.log("NETLIFY_DEPLOY_BRIDGE_PHASE", JSON.stringify({ phase:"request", elapsed_ms:0 }));
    const auth = req.headers.get("authorization") || "";
    if (!auth.startsWith("Bearer ")) return new Response("unauthorized", { status: 401 });
    const token = auth.slice(7);
    phase = "oidc_verify";
    const { payload } = await jwtVerify(token, jwks, { issuer, audience });
    console.log("NETLIFY_DEPLOY_BRIDGE_PHASE", JSON.stringify({ phase:"oidc_verified", elapsed_ms:Date.now()-startedAt }));
    if (payload.repository !== expectedRepo || payload.ref !== expectedRef || payload.workflow_ref !== expectedWorkflowRef) {
      return new Response("forbidden", { status: 403 });
    }
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch {}
    phase = "proxy_read";
    const proxy = await getProxy();
    console.log("NETLIFY_DEPLOY_BRIDGE_PHASE", JSON.stringify({ phase:"proxy_ready", elapsed_ms:Date.now()-startedAt }));
    const action = String(body.action || "proxy");
    if (action === "health") {
      return Response.json({ok:true,authority:"composio_jit"},{headers:{"Cache-Control":"no-store"}});
    }

    if (action === "trigger_build") {
      const expectedSha = String(body.expected_sha || "").trim();
      if (expectedSha && !/^[0-9a-f]{40}$/.test(expectedSha)) {
        return Response.json({ ok:false,error:"invalid expected_sha" },{status:400});
      }
      const title = encodeURIComponent("Powerhouse production " + (expectedSha || "main"));
      const endpoint = proxy + "/api/v1/sites/" + siteId + "/builds?branch=main&title=" + title;
      const out = await fetch(endpoint,{method:"POST",headers:{"user-agent":"bedrijfsgeheugen-oidc-netlify-bridge/3"}});
      const responseText=await out.text();
      let parsed:any={}; try{parsed=JSON.parse(responseText)}catch{}
      return Response.json({ok:out.ok,http:out.status,build_id:String(parsed?.id||"")||null,deploy_id:String(parsed?.deploy_id||"")||null,done:parsed?.done??null,error:parsed?.error??null,provider_message:String(parsed?.message||parsed?.msg||responseText).slice(0,500)},{status:out.ok?200:502,headers:{"Cache-Control":"no-store"}});
    }

    if (action === "inspect") {
      const deployId=String(body.deploy_id||"").trim();
      const buildId=String(body.build_id||"").trim();
      const result:any={ok:true};
      if(deployId){
        const out=await fetch(proxy+"/api/v1/deploys/"+encodeURIComponent(deployId),{headers:{"user-agent":"bedrijfsgeheugen-oidc-netlify-bridge/3"}});
        const raw=await out.text(); let x:any={}; try{x=JSON.parse(raw)}catch{}
        result.deploy={http:out.status,...safe(x)};
      }
      if(buildId){
        const out=await fetch(proxy+"/api/v1/builds/"+encodeURIComponent(buildId),{headers:{"user-agent":"bedrijfsgeheugen-oidc-netlify-bridge/3"}});
        const raw=await out.text(); let x:any={}; try{x=JSON.parse(raw)}catch{}
        result.build={http:out.status,...safe(x)};
      }
      return Response.json(result,{headers:{"Cache-Control":"no-store"}});
    }

    return Response.json({proxy},{headers:{"Cache-Control":"no-store"}});
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("NETLIFY_DEPLOY_BRIDGE_FAILED", JSON.stringify({ phase, elapsed_ms:Date.now()-startedAt, message:message.slice(0,180) }));
    const authPhase = phase === "request" || phase === "oidc_verify";
    return Response.json({ ok:false, error:authPhase ? "unauthorized" : "bridge_unavailable", phase }, {
      status: authPhase ? 401 : 503,
      headers:{ "Cache-Control":"no-store" }
    });
  }
});
