// Original Recovery Supervisor: shadow model for a single main-wide promotion slot.
// No provider write, no authorization, no change to native auto-merge.
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const sha=x=>typeof x==='string'&&/^[a-f0-9]{40}$/.test(x);
const integer=x=>Number.isSafeInteger(x)&&x>0;
function field(body,key){
 const lines=String(body??'').split(/\r?\n/).filter(x=>x.startsWith(key+':'));
 return lines.length===1?lines[0].slice(key.length+1).trim():null;
}
export function planPromotionSlot({repo,mainSha,prs,complete=false,authority=null,ledger=null,desired=null}={}){
 const report=(state,more={})=>({schema:'main-wide-promotion-slot-v1',mode:'SHADOW',state,mainSha:mainSha??null,mutation_authority:false,provider_write:false,...more});
 if(complete!==true||!sha(mainSha)||typeof repo!=='string'||!Array.isArray(prs)||
  prs.some(p=>!integer(p?.number)||p.state!=='open'||p.base?.ref!=='main'||p.base?.repo?.full_name!==repo||!sha(p.head?.sha)||!Object.hasOwn(p,'auto_merge')||(p.auto_merge!==null&&(typeof p.auto_merge!=='object'||Array.isArray(p.auto_merge))))||
  new Set(prs.map(p=>p.number)).size!==prs.length||new Set(prs.map(p=>p.head.sha)).size!==prs.length) return report('INVENTORY_UNPROVEN');
 const autoMerge=prs.filter(p=>p.auto_merge!==null).map(p=>({number:p.number,head:p.head.sha}));
 const candidates=prs.flatMap(p=>{
  const b=p.body,owner=field(b,'Writer-Lease-Owner'),obligation=field(b,'Obligation-ID'),epoch=field(b,'Writer-Lease-Main-Epoch'),count=field(b,'Writer-Lease-Drift-Refreshes');
  const countLines=String(b??'').split(/\r?\n/).filter(x=>x.startsWith('Writer-Lease-Drift-Refreshes:'));
  const valid=countLines.length<=1&&p.draft===false&&p.head.repo?.full_name===repo&&field(b,'Writer-Lease-State')==='TERMINAL_DELIVERY'&&owner&&obligation&&field(b,'Writer-Lease-Obligation')===obligation&&field(b,'Writer-Lease-Head')===p.head.sha&&sha(epoch)&&field(b,'Base-SHA')===epoch&&(count===null||/^\d{1,2}$/.test(count));
  if(!valid)return [];
  return [{number:p.number,head:p.head.sha,epoch,owner,obligation,refreshes:count===null?0:Number(count),auto_merge:p.auto_merge!==null}];
 }).sort((a,b)=>Number(b.refreshes>=2)-Number(a.refreshes>=2)||a.number-b.number);
 const inventory={open_count:prs.length,auto_merge:autoMerge,terminal_candidates:candidates};
 // Exact required context and verified exclusive app writer are separate from Actions'
 // common app identity. Shadow inputs can never establish real provider authority.
 if(!authority||authority.exclusiveWriterVerified!==true||authority.requiredContextVerified!==true||authority.strictMainVerified!==true||!integer(authority.appId)||authority.appId===15368) return report('PROVIDER_FENCE_UNPROVEN',inventory);
 if(!ledger||ledger.complete!==true||!Array.isArray(ledger.grants)||!integer(ledger.revision)||ledger.grants.some(g=>!integer(g.number)||!sha(g.head)||!sha(g.epoch)||g.appId!==authority.appId||!['success','revoked'].includes(g.state)||g.readback!==true)||new Set(ledger.grants.map(g=>g.head)).size!==ledger.grants.length) return report('GRANT_LEDGER_UNPROVEN',inventory);
 const chosen=candidates.find(c=>c.number===desired?.number&&c.head===desired?.head&&c.owner===desired?.owner&&c.obligation===desired?.obligation);
 const exactEvidence=desired?.currentMainSha===mainSha&&desired?.behindBy===0&&desired?.requiredGreen===true&&desired?.codeqlGreen===true&&desired?.mergeable===true;
 const active=ledger.grants.filter(g=>g.state==='success');
 if(active.length>1)return report('REVOKE_ALL_CONFLICTING_GRANTS',{...inventory,revoke:active});
 if(active.length===1){
  const g=active[0];
  if(!chosen||g.number!==chosen.number||g.head!==chosen.head||g.epoch!==mainSha||chosen.epoch!==mainSha||!exactEvidence)return report('REVOKE_AND_READBACK_BEFORE_TRANSFER',{...inventory,revoke:[g]});
  return report('HOLD_EXISTING_GRANT',{...inventory,holder:g});
 }
 if(!chosen)return report('NO_EXACT_REQUEST',inventory);
 if(chosen.epoch!==mainSha)return report('RESERVE_ONLY_NO_SYNC_AUTHORITY',{...inventory,requested:chosen});
 if(!exactEvidence)return report('EXACT_TERMINAL_EVIDENCE_REQUIRED',inventory);
 // A proposal only. Actual provider status mutation requires a separately
 // verified exclusive writer, atomic ledger CAS, live readback and trusted deployment.
 return report('PROPOSE_SINGLE_GRANT',{...inventory,grant:{number:chosen.number,head:chosen.head,epoch:mainSha,appId:authority.appId,expectedLedgerRevision:ledger.revision}});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [input,output,repo,mainSha]=process.argv.slice(2);
 const prs=JSON.parse(readFileSync(input,'utf8'));
 const result=planPromotionSlot({repo,mainSha,prs,complete:true});
 writeFileSync(output,JSON.stringify(result,null,2)+'\n');
 console.log('PROMOTION_SLOT_SHADOW:'+JSON.stringify({state:result.state,open_count:result.open_count,auto_merge_count:result.auto_merge?.length,terminal_count:result.terminal_candidates?.length,mutation_authority:false}));
}
