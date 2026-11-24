/* Record generic incident tickets without exposing public vulnerability details.
 * This repository is public: no hostname, vulnerable endpoint, exploit or
 * credential may appear in an issue body/title. Fingerprints deduplicate.
 * Engineering receives a labeled review item; no protected merge is bypassed.
 */
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';

const gh=(args)=>execFileSync('gh',args,{encoding:'utf8',timeout:15000,stdio:['ignore','pipe','pipe']});
export function publicIncidentSummary(issue,{repository,runId}={}){
 if(!/^[a-f0-9]{16}$/.test(issue.fingerprint))throw Error('INVALID_INCIDENT_FINGERPRINT');
 const severity=issue.severity==='HIGH'?'HIGH':'REVIEW';
 return {
  title:'Security Guardian: onderzoek '+issue.fingerprint,
  body:[
   'Security-agent incident · minimaal openbaar dossier.',
   '',
   'Correlation-ID: '+issue.fingerprint,
   'Prioriteit: '+severity,
   'Herkomst: bestaande Security Operations-monitor.',
   '',
   'Geen technische kwetsbaarheidsdetails of locatiegegevens in deze publieke repository.',
   'Onderzoek hoort in geautoriseerde beheer- en bronlogsystemen. Een mislukte check is niet automatisch een bevestigd datalek.',
   'Engineering-agent: onderzoek de relevante beschermde bron, maak uitsluitend een veilige herstel-PR, behoud verplichte goedkeuringen.',
   'Heartbeat/ONE BRAIN: sluit uitsluitend na onafhankelijk productie-readback, incidentstatus en effectmeting.',
   'Bronrun: https://github.com/'+(repository||'arthurprinsen-ai/Bedrijfsgeheugen')+'/actions/runs/'+String(runId||'onbekend')
  ].join('\n')
 };
}
export async function syncIncidents(report,{runId=process.env.GITHUB_RUN_ID,repo=process.env.GITHUB_REPOSITORY,call=gh}={}){
 if(!repo||!runId)throw Error('MISSING_CANONICAL_RUNTIME');
 const labels=['security-guardian','agent-engineering-review'];
 for(const label of labels)call(['label','create',label,'--force','--color',label==='security-guardian'?'9b2d30':'534caf','--description','Security Operations canonical incident']);
 const current=JSON.parse(call(['issue','list','--state','open','--limit','100','--label','security-guardian','--json','number,title,body']));
 let created=0,existing=0;
 for(const issue of report.issues.filter(x=>x.severity==='HIGH').concat(report.issues.filter(x=>x.severity!=='HIGH'))){
  const meta=publicIncidentSummary(issue,{repository:repo,runId});
  if(current.some(entry=>entry.title===meta.title||entry.body?.includes('Correlation-ID: '+issue.fingerprint))){existing++;continue;}
  if(created>=6)continue; // Fixed per-run budget; later runs pick remaining fingerprints.
  call(['issue','create','--title',meta.title,'--body',meta.body,'--label',labels.join(',')]);
  current.push({title:meta.title,body:meta.body});
  created++;
 }
 return {created,existing,deferred:Math.max(0,report.issues.length-created-existing),tracked:report.issues.length};
}
if(process.argv[1]&&process.argv[1].endsWith('/security-guardian-incidents.mjs')){
 const report=JSON.parse(await readFile(process.argv[2],'utf8'));
 const result=await syncIncidents(report);
 console.log('SECURITY_INCIDENT_LEDGER '+JSON.stringify(result));
}
