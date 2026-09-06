import { createHash } from 'node:crypto';

const ORIGIN='https://www.bedrijfsgeheugen.nl';
const OUTCOME_STAGES=new Set(['lead','qualified_lead','appointment','proposal','won_order','revenue']);
const FORBIDDEN_KEY=/(?:^|_)(?:email|e_mail|phone|telephone|mobile|name|first_name|last_name|full_name|form|form_content|message|free_text|authorization|password|passwd|token|secret|api_key|apikey)(?:$|_)/i;
const EVENT_FIELDS=['event_id','event_type','canonical','intent','intent_owner','attribution_root_key','source','medium','campaign','occurred_at','page_role','funnel_stage','value','fingerprint'];
const OUTCOME_FIELDS=['outcome_id','stage','attribution_root_key','canonical','intent_owner','occurred_at','revenue_eur','source','fingerprint'];

function clean(v,max=500){return String(v??'').trim().slice(0,max);}
function iso(value){const d=new Date(value);if(Number.isNaN(d.getTime()))throw new Error('INVALID_OCCURRED_AT');return d.toISOString();}
function internal(url){const v=clean(url,1000);if(!v)return '';if(v===`${ORIGIN}/`||v.startsWith(`${ORIGIN}/`))return v;throw new Error('INVALID_CANONICAL');}
function assertNoForbiddenFields(input){for(const key of Object.keys(input||{})){if(FORBIDDEN_KEY.test(key))throw new Error(`PII_OR_SECRET_FIELD:${key}`);}}
function stableHash(value){return createHash('sha256').update(String(value)).digest('hex');}

export function normalizeGrowthEventForDataHub(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('INVALID_GROWTH_EVENT');
  assertNoForbiddenFields(input);
  const event_id=clean(input.event_id,200);const event_type=clean(input.event_type,120);
  if(!event_id||!event_type)throw new Error('INVALID_GROWTH_EVENT');
  const out={event_id,event_type,canonical:internal(input.canonical),occurred_at:iso(input.occurred_at||new Date().toISOString())};
  for(const key of EVENT_FIELDS){if(['event_id','event_type','canonical','occurred_at'].includes(key))continue;const value=input[key];if(value===undefined||value===null||value==='')continue;if(key==='value'){const n=Number(value);if(!Number.isFinite(n))throw new Error('INVALID_EVENT_VALUE');out.value=n;}else out[key]=clean(value,key==='fingerprint'?300:500);}
  if(!out.fingerprint)out.fingerprint=`growth-event|${stableHash(event_id).slice(0,24)}`;
  return out;
}

export function normalizeGrowthOutcome(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('INVALID_GROWTH_OUTCOME');
  assertNoForbiddenFields(input);
  const outcome_id=clean(input.outcome_id,200);const stage=clean(input.stage,80).toLowerCase();const root=clean(input.attribution_root_key,300);
  if(!outcome_id||!root)throw new Error('INVALID_GROWTH_OUTCOME');
  if(!OUTCOME_STAGES.has(stage))throw new Error('INVALID_OUTCOME_STAGE');
  const revenue=Number(input.revenue_eur??0);if(!Number.isFinite(revenue)||revenue<0)throw new Error('INVALID_REVENUE');
  const out={outcome_id,stage,attribution_root_key:root,occurred_at:iso(input.occurred_at||new Date().toISOString()),revenue_eur:Math.round(revenue*100)/100};
  if(input.canonical)out.canonical=internal(input.canonical);
  for(const key of OUTCOME_FIELDS){if(['outcome_id','stage','attribution_root_key','canonical','occurred_at','revenue_eur'].includes(key))continue;const value=input[key];if(value!==undefined&&value!==null&&value!=='')out[key]=clean(value,key==='fingerprint'?300:500);}
  if(!out.fingerprint)out.fingerprint=`growth-outcome|${stableHash(outcome_id).slice(0,24)}`;
  return out;
}

export function growthEventIdempotencyKey(input){const id=clean(input?.event_id,200);if(!id)throw new Error('INVALID_EVENT_ID');return `growth-event:${stableHash(id)}`;}
export function growthOutcomeIdempotencyKey(input){const id=clean(input?.outcome_id,200);if(!id)throw new Error('INVALID_OUTCOME_ID');return `growth-outcome:${stableHash(id)}`;}

export function businessValueScore(metrics={}){
  const n=k=>Math.max(0,Number(metrics[k]||0));
  return Number((
    n('impressions')*0.0001+
    n('clicks')*0.02+
    n('engaged_visits')*0.05+
    n('cta_clicks')*0.5+
    n('qualified_leads')*50+
    n('won_orders')*500+
    n('revenue_eur')*0.05
  ).toFixed(4));
}

export { OUTCOME_STAGES, ORIGIN };