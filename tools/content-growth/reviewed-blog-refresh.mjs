import crypto from 'node:crypto';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
export function planDraftBlogRefresh({date,repository,expectedHead,pr,artifact,previous}={}){
 const repair=artifact?.blog_quality_repair;
 const eligible=/^\d{4}-\d{2}-\d{2}$/.test(date||'')&&pr?.state==='open'&&pr?.draft===true
  &&pr?.head?.sha===expectedHead&&pr?.head?.ref==='automation/powerhouse-blog-'+date
  &&pr?.head?.repo?.full_name===repository&&pr?.base?.ref==='main'
  &&String(pr?.body||'').split(/\r?\n/).some(s=>s.trim()==='Obligation-ID: content-publication:'+date+':blog')
  &&!/^Writer-Lease-State:\s*TERMINAL_DELIVERY/m.test(pr?.body||'')
  &&artifact?.ok===true&&artifact?.run_date===date&&artifact?.reader_ready===true
  &&artifact?.canonical_url===previous?.canonical_url
  &&artifact?.canonical_url==='https://www.bedrijfsgeheugen.nl/blog/'+artifact?.slug+'/'
  &&repair?.contract==='same-obligation-unsent-blog-quality-repair-v1'
  &&/^[a-f0-9]{64}$/.test(repair?.rejected_body_sha256||'')&&repair?.rejection_codes?.length>0
  &&crypto.createHash('sha256').update(String(artifact.body||'')).digest('hex')!==repair.rejected_body_sha256;
 return {eligible:Boolean(eligible)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [prFile,artifactFile,proofFile,date,repository,expectedHead]=process.argv.slice(2);
 const pr=JSON.parse(fs.readFileSync(prFile,'utf8')),artifact=JSON.parse(fs.readFileSync(artifactFile,'utf8'));
 const proof=JSON.parse(fs.readFileSync(proofFile,'utf8'));
 console.log(planDraftBlogRefresh({date,repository,expectedHead,pr,artifact,previous:proof.observed_evidence}).eligible?'AUTHORIZED':'PRESERVE');
}
