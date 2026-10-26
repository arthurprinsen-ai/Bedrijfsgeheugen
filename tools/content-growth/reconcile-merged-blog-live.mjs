/**
 * Same-owner hourly blog proof reconciliation.
 * An exact merged GitHub blog + live production SHA + canonical rendered article
 * must exist BEFORE the existing Supabase publication RPC is called.
 * No second scheduler, writer, payment event or fabricated conversion.
 */
const REPO='arthurprinsen-ai/Bedrijfsgeheugen';
const PUBLIC='https://www.bedrijfsgeheugen.nl';
const SUPABASE='https://adhjwmvyoixzjtmiroln.supabase.co';
const SHA=/^[0-9a-f]{40}$/;
const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const terminal=new Set(['LIVE_PROVEN','MEASURED','LEARNED']);
const auth=(key)=>({apikey:key,authorization:'Bearer '+key,'content-type':'application/json'});
function verifyDate(date){
 if(!DATE.test(date)||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw Error('BLOG_PROOF_INVALID_DATE');
 return date;
}
async function read(response,kind){
 if(!response?.ok)throw Error('BLOG_PROOF_PROVIDER_'+kind+'_HTTP_'+String(response?.status||0));
 const v=await response.json();
 if(!v||typeof v!=='object')throw Error('BLOG_PROOF_INVALID_'+kind);
 return v;
}
function validArticle(html,canonical,contentId){
 if(typeof html!=='string'||html.length<120||html.length>2_000_000||!/<h1[\s>]/i.test(html))return false;
 const links=html.match(/<link\b[^>]*>/gi)||[];
 const matches=links.filter(x=>/\brel\s*=\s*(['"])canonical\1/i.test(x)
  && x.includes('href="'+canonical+'"')||/\brel\s*=\s*(['"])canonical\1/i.test(x)
  && x.includes("href='"+canonical+"'"));
 return matches.length===1&&(html.includes('data-content-id="'+contentId+'"')||html.includes("data-content-id='"+contentId+"'"));
}
export async function reconcileMergedDailyBlog({
 date,gitHubToken,supabaseKey,supabaseUrl=SUPABASE,fetcher=fetch,now=new Date(),repository=REPO
}={}){
 verifyDate(date);
 if(repository!==REPO||new URL(supabaseUrl).origin!==SUPABASE)throw Error('BLOG_PROOF_AUTHORITY_MISMATCH');
 if(!gitHubToken)throw Error('BLOG_PROOF_GITHUB_AUTH_REQUIRED');
 const branch='automation/powerhouse-blog-'+date;
 const owner=repository.split('/')[0];
 const ghHeaders={authorization:'Bearer '+gitHubToken,accept:'application/vnd.github+json'};
 const prs=await read(await fetcher(
  'https://api.github.com/repos/'+repository+'/pulls?state=closed&head='+encodeURIComponent(owner+':'+branch)+'&per_page=30',
  {headers:ghHeaders,signal:AbortSignal.timeout(12000)}
 ),'GITHUB_PR');
 if(!Array.isArray(prs))throw Error('BLOG_PROOF_PR_ARRAY_REQUIRED');
 const eligible=prs.filter(x=>x?.head?.ref===branch&&x?.base?.ref==='main'&&x?.merged_at&&SHA.test(x?.merge_commit_sha||''));
 if(eligible.length===0)return {state:'NO_MERGED_DAILY_BLOG',date,canonical_verified:false};
 if(eligible.length!==1)throw Error('BLOG_PROOF_MULTIPLE_MERGED_WRITERS');
 const pr=eligible[0];
 if(!supabaseKey)throw Error('BLOG_PROOF_SUPABASE_AUTH_REQUIRED');
 const endpoint=supabaseUrl+'/rest/v1/';
 const condition='tenant_id=eq.canonical&publication_date=eq.'+date+'&channel=eq.blog&select=status,content_id,slug,canonical_url,external_id,live_proven_at';
 const obligations=await read(await fetcher(endpoint+'content_publication_obligations?'+condition,
  {headers:auth(supabaseKey),signal:AbortSignal.timeout(12000)}),'OBLIGATION');
 if(!Array.isArray(obligations)||obligations.length!==1)throw Error('BLOG_PROOF_CANONICAL_OBLIGATION_REQUIRED');
 const entry=obligations[0];
 const slug=String(entry.slug||''),id=String(entry.content_id||'');
 const canonical=PUBLIC+'/blog/'+slug+'/';
 if(!SLUG.test(slug)||id!=='blog:'+slug||entry.canonical_url!==canonical)throw Error('BLOG_PROOF_ARTIFACT_LINEAGE_INVALID');
 if(terminal.has(entry.status))return {state:'ALREADY_LIVE_RECORDED',date,canonical_verified:true,slug,existing_state:entry.status};
 const release=await read(await fetcher(PUBLIC+'/release.json?proof_date='+date,
  {headers:{'cache-control':'no-cache'},signal:AbortSignal.timeout(15000)}),'NETLIFY_RELEASE');
 if(release.context!=='production'||release.production_authority!=='BG169'
   ||!SHA.test(release.commit_ref||'')||!String(release.deploy_id||'').trim())throw Error('BLOG_PROOF_RELEASE_AUTHORITY_REQUIRED');
 const relation=await read(await fetcher(
  'https://api.github.com/repos/'+repository+'/compare/'+pr.merge_commit_sha+'...'+release.commit_ref,
  {headers:ghHeaders,signal:AbortSignal.timeout(12000)}
 ),'GITHUB_ANCESTRY');
 if(!['identical','ahead'].includes(relation.status))throw Error('BLOG_PROOF_MERGE_NOT_IN_LIVE_RELEASE');
 const htmlResponse=await fetcher(canonical,{headers:{'cache-control':'no-cache'},signal:AbortSignal.timeout(15000)});
 if(!htmlResponse?.ok||htmlResponse.status!==200
   ||!String(htmlResponse.headers?.get?.('content-type')||'').includes('text/html'))throw Error('BLOG_PROOF_PAGE_NOT_HTML_200');
 const html=await htmlResponse.text();
 if(!validArticle(html,canonical,id))throw Error('BLOG_PROOF_WRONG_PUBLIC_PAGE_OR_FALLBACK');
 const payload={
  p_tenant_id:'canonical',p_publication_date:date,p_channel:'blog',p_status:'LIVE_PROVEN',
  p_content_id:id,p_slug:slug,p_external_id:String(release.deploy_id),p_canonical_url:canonical,
  p_evidence:{
   source:'EXACT_PROTECTED_MERGE_AND_PRODUCTION_HTML',
   proof_contract:'POWERHOUSE-DAILY-BLOG-PRODUCTION-CLOSURE-v1',
   github_pr_number:pr.number,
   github_merge_sha:pr.merge_commit_sha,
   netlify_production_sha:release.commit_ref,
   netlify_deploy_id:String(release.deploy_id),
   public_http_status:200,
   public_canonical:canonical,
   verified_content_id:id,
   live_proof_observed_at:now.toISOString(),
   outcome_scope:'PUBLICATION_ONLY_NOT_MEASURED_LEADS_OR_REVENUE'
  },
  p_next_action:'Measure Search Console/GA4 engagement, verified leads and paid customer outcomes via canonical learning.'
 };
 const recorded=await read(await fetcher(endpoint+'rpc/record_content_publication_state',{
  method:'POST',headers:auth(supabaseKey),body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)
 }),'PUBLICATION_RPC');
 if(!terminal.has(recorded.status))throw Error('BLOG_PROOF_CANONICAL_TERMINAL_WRITE_NOT_PROVEN');
 const reconcile=await read(await fetcher(endpoint+'rpc/powerhouse_reconcile_terminal_publication_state',{
  method:'POST',headers:auth(supabaseKey),body:JSON.stringify({p_run_date:date}),signal:AbortSignal.timeout(15000)
 }),'CHANNEL_RPC');
 if(reconcile.run_date!==date)throw Error('BLOG_PROOF_CHANNEL_RECONCILIATION_MISMATCH');
 const proof=await read(await fetcher(endpoint+'content_publication_obligations?'+condition,{
  headers:auth(supabaseKey),signal:AbortSignal.timeout(12000)
 }),'FINAL_READBACK');
 if(!Array.isArray(proof)||proof.length!==1||!terminal.has(proof[0].status)
   ||proof[0].external_id!==String(release.deploy_id))throw Error('BLOG_PROOF_DATABASE_READBACK_FAILED');
 return {state:'LIVE_PROVEN',date,slug,canonical_verified:true,netlify_deploy_id:String(release.deploy_id),
  merged_pr:pr.number,publication_status:proof[0].status,channel_reconciliation:reconcile};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 try{
  const result=await reconcileMergedDailyBlog({
   date:process.argv[2],gitHubToken:process.env.GH_TOKEN,
   supabaseKey:process.env.SUPABASE_SERVICE_ROLE_KEY,
   supabaseUrl:process.env.SUPABASE_URL
  });
  console.log(JSON.stringify(result));
 }catch(error){
  console.error('BLOG_LIVE_RECONCILIATION_BLOCKED',String(error?.message||'UNKNOWN').slice(0,180));
  process.exitCode=1;
 }
}
