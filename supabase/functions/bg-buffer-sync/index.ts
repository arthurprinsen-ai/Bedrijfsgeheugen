// Buffer -> bg-post-import: sent posts + metrics. Fail closed on stale provider windows.
import { createClient } from 'npm:@supabase/supabase-js@2';

const ORG_ID='6a7037d2d8fce064ac755ec7';
const CHUNK=50;
const MAX_PAGES=20;
const TERUGKIJK_UUR=Number(Deno.env.get('BUFFER_LOOKBACK_HOURS')||192);
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});

async function bufferGraphQL(query:string,token:string){
  const r=await fetch('https://api.buffer.com',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({query})});
  const d:any=await r.json().catch(()=>({}));
  if(!r.ok||d.errors)throw new Error(`Buffer: ${d.errors?.[0]?.message||r.status}`);
  return d.data;
}
function campaignFromText(value:unknown){const text=String(value??'');return text.match(/(?:https?:\/\/(?:www\.)?bedrijfsgeheugen\.nl)?\/g\/([A-Za-z0-9_-]{4,64})/i)?.[1]??null;}
async function bufferPosts(token:string,cursor?:string){
  const cursorArg=cursor?`, after: "${cursor.replaceAll('"','')}"`:'';
  const data=await bufferGraphQL(`{ posts(first: ${CHUNK}${cursorArg}, input: { organizationId: "${ORG_ID}", filter: { status: [sent] }, sort: [{ field: dueAt, direction: desc }] }) { edges { node { id channelId channelService sentAt dueAt text externalLink metrics { name value } } } pageInfo { hasNextPage endCursor } } }`,token);
  const posts=(data?.posts?.edges||[]).map((e:any)=>{const text=String(e.node.text??'');return {platform:String(e.node.channelService??'').toLowerCase(),external_post_id:e.node.id,post_id:e.node.id,published_at:e.node.sentAt||e.node.dueAt,bron:'buffer',tenant_id:'bedrijfsgeheugen',text,channel_id:e.node.channelId??null,source_campaign_id:campaignFromText(text),metrics:Object.fromEntries((e.node.metrics||[]).map((m:any)=>[m.name,m.value]))};});
  return{posts,cursor:data?.posts?.pageInfo?.hasNextPage?data.posts.pageInfo.endCursor:undefined};
}
async function ingestPosts(posts:any[],serviceKey:string,url:string){if(!posts.length)return{posts:0,metingen:0};const r=await fetch(url+'/functions/v1/bg-post-import',{method:'POST',headers:{authorization:'Bearer '+serviceKey,'content-type':'application/json'},body:JSON.stringify({posts})});const d:any=await r.json().catch(()=>({}));if(!r.ok)throw new Error(`Import (${r.status}): ${d.error||d.message||'unknown'}`);return{posts:d.posts||0,metingen:d.metingen||0};}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json({error:'POST_ONLY'},405);
  const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)return json({error:'CONFIG'},500);
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const runId=crypto.randomUUID(),nu=new Date(),afgelopen=new Date(nu.getTime()-TERUGKIJK_UUR*60*60*1000);
  try{
    const {data:circuit,error:circuitError}=await client.from('brain_records').select('result').eq('tenant_id','canonical').eq('record_id','buffer-rate-limit-circuit-v1').maybeSingle();
    if(circuitError)throw new Error('BUFFER_CIRCUIT_READ: '+circuitError.message);
    const retryAt=String(circuit?.result?.retry_at||'').trim();
    if(retryAt && Date.parse(retryAt)>Date.now()){
      return json({ok:true,skipped:true,reason:'BUFFER_RATE_LIMIT_COOLDOWN',retry_at:retryAt});
    }
    const {data:tokens,error}=await client.from('bg_integrations').select('token').eq('integration','buffer').eq('status','actief').single();
    if(error||!tokens?.token)throw new Error('BUFFER_TOKEN_ONTBREEKT: '+(error?.message||'missing'));
    let posts:any[]=[],cursor:string|undefined,it=0,oldestSeen:Date|null=null,newestSeen:Date|null=null;
    do{
      const page=await bufferPosts(tokens.token as string,cursor);
      for(const x of page.posts){
        const ts=new Date(x.published_at);
        if(Number.isFinite(ts.getTime())){if(!oldestSeen||ts<oldestSeen)oldestSeen=ts;if(!newestSeen||ts>newestSeen)newestSeen=ts;}
        if(Number.isFinite(ts.getTime())&&ts>afgelopen)posts.push(x);
      }
      cursor=page.cursor;it++;
      if(it>=MAX_PAGES&&cursor)throw new Error('BUFFER_PAGINATION_LIMIT_REACHED');
      // Explicit dueAt desc makes an old page a safe early-stop boundary.
      if(oldestSeen&&oldestSeen<=afgelopen)cursor=undefined;
    }while(cursor);
    if(!newestSeen)throw new Error('BUFFER_PROVIDER_WINDOW_EMPTY');
    const providerAgeHours=(nu.getTime()-newestSeen.getTime())/3600000;
    if(providerAgeHours>TERUGKIJK_UUR)throw new Error(`BUFFER_PROVIDER_WINDOW_STALE:${providerAgeHours.toFixed(2)}h`);
    const result=await ingestPosts(posts,key,url);
    await client.from('bg_buffer_sync').insert({run_id:runId,afgelopen_uur:afgelopen,posts_opgehaald:posts.length,posts_bijgewerkt:result.posts,metingen_ingevuld:result.metingen,status:'ok',uitgevoerd_op:nu});
    await client.from('bg_buffer_ingest_status').upsert({organisatie_id:ORG_ID,laatst_opgehaald:nu,tot_posts:posts.length,tot_metingen:result.metingen},{onConflict:'organisatie_id'});
    const { error: observationError } = await client.rpc('powerhouse_record_source_observation_v1', {
      p_source_key: 'social-buffer',
      p_dedupe_key: 'buffer-sync:' + runId,
      p_external_event_id: runId,
      p_observed_at: nu.toISOString(),
      p_evidence: { contract: 'buffer-observed-social-v1', provider_sync_ok: true, posts: posts.length, metingen: result.metingen, newest_provider_sent_at: newestSeen.toISOString(), provider_age_hours: Number(providerAgeHours.toFixed(2)) }
    });
    if (observationError) throw new Error('SOURCE_OBSERVATION: ' + observationError.message);
    return json({ok:true,posts:posts.length,metingen:result.metingen,iteraties:it,terugkijk_uur:TERUGKIJK_UUR,newest_provider_sent_at:newestSeen.toISOString(),provider_age_hours:Number(providerAgeHours.toFixed(2))});
  }catch(e:any){const msg=String(e.message).slice(0,500);await client.from('bg_buffer_sync').insert({run_id:runId,afgelopen_uur:afgelopen,posts_opgehaald:0,posts_bijgewerkt:0,metingen_ingevuld:0,status:'fout',fout:msg,uitgevoerd_op:nu});return json({ok:false,error:msg},500);}
});
