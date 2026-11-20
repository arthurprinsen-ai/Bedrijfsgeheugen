/**
 * Original five-minute Powerhouse/Heartbeat runner's bounded, read-only portal
 * signal evaluation. This is not a second scheduler, customer-state writer,
 * provider sender, autonomous executor or proof of fresh measured KPI data.
 */
import {evaluateSignals,normalizeRule} from '../../../portal-v2/signal-detection.js';

export const PORTAL_SIGNAL_HEARTBEAT_CONTRACT='portal-voice-alert-heartbeat-v1';
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const layerData=row=>{const p=obj(row?.payload);return Object.keys(obj(p.data)).length?obj(p.data):p;};
const stamp=row=>String(row?.source_updated_at||row?.updated_at||'').trim();
const safeIso=value=>{const t=Date.parse(value||'');return Number.isFinite(t)?new Date(t).toISOString():null;};
const lower=v=>String(v||'').toLowerCase();
async function digest(value){
  const bytes=new TextEncoder().encode(value);
  const hash=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export function monitoringRuleCandidates(rows){
  const grouped=new Map();
  for(const row of Array.isArray(rows)?rows.slice(0,200):[]){
    const tenant=String(row?.tenant_id||'').trim();
    if(!tenant||tenant.length>180||!['canonical-brain','legacy-migration'].includes(row?.layer))continue;
    const data=layerData(row);
    const rules=data?.portal?.signalering?.rules;
    if(!Array.isArray(rules)||!rules.some(r=>r?.monitoring===true&&r?.enabled!==false))continue;
    const updated=safeIso(stamp(row));
    if(!updated)continue;
    const prev=grouped.get(tenant);
    const score=Date.parse(updated);
    if(!prev||score>prev.score||(score===prev.score&&row.layer==='canonical-brain'))
      grouped.set(tenant,{tenant,data,rules,sourceUpdatedAt:updated,score});
  }
  return [...grouped.values()].slice(0,100);
}
export async function planOriginalHeartbeatObservations(rows,{now=new Date().toISOString()}={}){
  if(!safeIso(now))throw new Error('PORTAL_SIGNAL_CLOCK_INVALID');
  const results=[];
  for(const source of monitoringRuleCandidates(rows)){
    const eligible=source.rules.map(normalizeRule).filter(r=>r?.monitoring&&r?.enabled);
    const evaluated=evaluateSignals(eligible,source.data,{authenticated:true,demo:false});
    for(const event of evaluated){
      if(!event.triggered)continue;
      // No database-adjacent external notification until the source's actual
      // measurement freshness, per-recipient channel consent/suppression,
      // original sender and independent provider readback are demonstrated.
      const sourceRevision=source.sourceUpdatedAt;
      const identity=await digest([source.tenant,event.id,event.metricId,event.operator,event.threshold,
        sourceRevision,event.status].join('\u001f'));
      results.push(Object.freeze({
        dedupeKey:'portal-signal-observation:'+identity.slice(0,48),
        eventType:'portal_user_signal_observed',
        tenantFingerprint:(await digest(source.tenant)).slice(0,24),
        ruleFingerprint:(await digest(source.tenant+'|'+event.id)).slice(0,24),
        metricId:event.metricId,
        sourceRevision,
        evidence:Object.freeze({
          contract:PORTAL_SIGNAL_HEARTBEAT_CONTRACT,
          metricId:event.metricId,operator:event.operator,severity:event.severity,
          sourcePath:event.evidence.sourcePath,
          sourceRevision,signalDetected:true,
          userRequestedMonitoring:true,
          requestedChannels:Object.freeze({email:event.channels.email,push:event.channels.push}),
          sourceMeasurementFreshness:'UNKNOWN',
          notificationDeliveryVerified:false,
          providerMessageId:null,
          independentOutcomeVerified:false,
          autonomousActionExecuted:false
        })
      }));
    }
  }
  return Object.freeze(results.slice(0,100));
}
export function planNotificationSafety(observation,{providerVerified=false,recipientConsent=false,
  recipientAllowed=false,sourceFreshnessVerified=false,providerId=null}={}){
  if(!observation?.evidence?.signalDetected)return Object.freeze({state:'NO_SIGNAL',maySend:false});
  if(!observation.evidence.requestedChannels.email&&!observation.evidence.requestedChannels.push)
    return Object.freeze({state:'NO_CHANNEL_OPT_IN',maySend:false});
  if(!sourceFreshnessVerified)return Object.freeze({state:'MEASUREMENT_FRESHNESS_NOT_VERIFIED',maySend:false});
  if(!recipientConsent||!recipientAllowed)return Object.freeze({state:'RECIPIENT_CONSENT_OR_SUPPRESSION_DUE',maySend:false});
  if(!providerVerified||!providerId)return Object.freeze({state:'ORIGINAL_PROVIDER_READBACK_DUE',maySend:false});
  // Eligibility is not delivery. The original authorized sender and provider
  // still own the write, exact message ID, consumer ACK and Heartbeat outcome.
  return Object.freeze({state:'ORIGINAL_PROVIDER_DISPATCH_APPROVAL_DUE',maySend:false});
}
