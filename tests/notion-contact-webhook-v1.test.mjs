import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, webcrypto } from "node:crypto";
import { normalizedLinkedin, project, mergedExtra, CORE_ID } from "../supabase/functions/bg-notion-sync/notion-contact-projection.mjs";
import { authenticNotionPayload, handleNotionContactWebhook } from "../supabase/functions/bg-notion-sync/notion-contact-webhook.mjs";
globalThis.crypto ||= webcrypto;

const sample = (changes = {}) => ({
  object:"page",id:"11111111-1111-4111-8111-111111111111",
  last_edited_time:"2026-10-08T18:00:00Z",
  parent:{type:"data_source_id",data_source_id:CORE_ID},
  properties:{
    LinkedIn:{type:"url",url:"https://www.linkedin.com/in/example-person/"},
    Contactbeleid:{type:"select",select:{name:"Niet benaderen"}},
    Kanaal:{type:"select",select:{name:"LinkedIn DM"}},
    "Tekst goedgekeurd":{type:"checkbox",checkbox:false}
  },...changes
});

test("only canonical personal LinkedIn URLs are accepted",()=>{
  assert.equal(normalizedLinkedin("https://linkedin.com/in/example-person/"),"https://www.linkedin.com/in/example-person");
  for(const url of ["http://linkedin.com/in/a","https://evil.net/in/a","https://linkedin.com/feed","https://linkedin.com/in/a/b","https://linkedin.com.evil.net/in/a"]) assert.equal(normalizedLinkedin(url),null);
});
test("only live pages in the configured source are projected",()=>{
  assert.equal(project(sample({archived:true})),null);
  assert.equal(project(sample({parent:{type:"data_source_id",data_source_id:"another"}})),null);
  const value=project(sample());
  assert.equal(value.metadata.contactbeleid,"Niet benaderen");
  assert.equal(value.metadata.kanaal,"LinkedIn DM");
  assert.equal(value.metadata.can_send,false);
  assert.equal(value.metadata.goedgekeurd,false);
});
test("CRM context remains intact and stale/conflicting changes are ignored",()=>{
  const first=project(sample());
  const original={opt_out:true,other:"kept"};
  const merged=mergedExtra(original,first.metadata);
  assert.deepEqual({opt_out:merged.opt_out,other:merged.other},{opt_out:true,other:"kept"});
  assert.equal(mergedExtra(merged,first.metadata),null);
  assert.equal(mergedExtra({...original,notion_contact_context:{page_id:"other"}},first.metadata),null);
});
test("HMAC verifies raw payload and rejects a forged signature", async()=>{
  const secret="test-verification-token", body='{"type":"page.properties_updated"}';
  const signature="sha256="+createHmac("sha256",secret).update(body).digest("hex");
  assert.equal(await authenticNotionPayload(body,signature,secret),true);
  assert.equal(await authenticNotionPayload(body+" ",signature,secret),false);
  assert.equal(await authenticNotionPayload(body,signature,"bad-secret"),false);
  assert.equal(await authenticNotionPayload(body,null,secret),false);
});
test("unconfigured subscription fails closed without writing CRM", async()=>{
  let written=false;
  const db={rpc:async()=>({data:null,error:null}),from:()=>{written=true;throw Error("unexpected write")}};
  const req=new Request("https://example.org?mode=notion-contacts",{method:"POST",body:'{"type":"page.properties_updated"}'});
  const res=await handleNotionContactWebhook(req,db,"notion-token",async()=>{throw Error("unexpected read")});
  assert.equal(res.status,503);assert.equal(written,false);
});

test("signed Notion update mutates only a matching CRM context, never sends", async()=>{
  const secret="secret_admin_test_only_123456789012345", event={
    id:"22222222-2222-4222-8222-222222222222",
    type:"page.properties_updated",
    entity:{type:"page",id:"11111111-1111-4111-8111-111111111111"}
  };
  const body=JSON.stringify(event);
  const sig="sha256="+createHmac("sha256",secret).update(body).digest("hex");
  let savedExtra, auditWritten=false;
  const row={sleutel:"person-1",extra:{opt_out:true},bijgewerkt_op:"2026-10-08T17:00:00Z"};
  const db={
    rpc:async()=>({data:secret,error:null}),
    from:(name)=>{
      if(name==="bg_notion_sync")return {insert:async()=>{auditWritten=true;return {error:null}}};
      assert.equal(name,"bg_connecties");
      return {
        select:()=>({eq:()=>({limit:async()=>({data:[row],error:null})})}),
        update:(change)=>{savedExtra=change.extra;return {eq:()=>({eq:()=>({select:async()=>({data:[{sleutel:"person-1"}],error:null})})})}}
      };
    }
  };
  const req=new Request("https://example.org?mode=notion-contacts",{method:"POST",headers:{"x-notion-signature":sig},body});
  const res=await handleNotionContactWebhook(req,db,"notion-token",async()=>sample());
  assert.equal(res.status,200);
  assert.equal((await res.json()).sent,0);
  assert.equal(savedExtra.opt_out,true);
  assert.equal(savedExtra.notion_contact_context.can_send,false);
  assert.equal(auditWritten,true);
});
