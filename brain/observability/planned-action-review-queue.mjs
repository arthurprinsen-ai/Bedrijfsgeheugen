import { evaluatePlannedActionRecall, OBSERVATION_CONTRACT, REVIEW_CONTRACT } from './planned-action-recall.mjs';

const RUN = /^github:run:([1-9][0-9]*)$/;
const PR = /^github:pr:([1-9][0-9]*)$/;
const REVIEW_PR_URL = /^https:\/\/github\.com\/arthurprinsen-ai\/Bedrijfsgeheugen\/pull\/([1-9][0-9]*)$/;
const SHA = /^[a-f0-9]{40}$/;
const SAFE_ID = /^[a-zA-Z0-9_.:|-]{4,180}$/;
const RULE = /^[A-Z][A-Z0-9_]+$/;

export const EVALUATION_CONTRACT = 'PLANNED_ACTION_REAL_CORPUS_REVIEW_QUEUE_V1';
export const REVIEW_FILE_ROOT = 'brain/independent-reviews/';

const dedupe = values => [...new Set(values)].sort();

export function compileIndependentReviewQueue(records, { now = new Date().toISOString(), days = 30 } = {}) {
  if (!Array.isArray(records)) throw TypeError('existing BRAIN records array required');
  if (!Number.isFinite(Date.parse(now)) || !Number.isInteger(days) || days < 1 || days > 365) throw TypeError('time window invalid');
  const from = new Date(Date.parse(now) - days * 86400000).toISOString();
  const seen = new Map(), conflicted = new Set(), reviewCounts = new Map();
  let invalidObservations = 0;
  for (const record of records) {
    const p = record?.payload;
    if (!p || typeof p !== 'object') continue;
    if (p.contract === REVIEW_CONTRACT) {
      if (SAFE_ID.test(p.decisionRecordId ?? '')) reviewCounts.set(p.decisionRecordId, (reviewCounts.get(p.decisionRecordId) ?? 0) + 1);
      continue;
    }
    if (p.contract !== OBSERVATION_CONTRACT) continue;
    const observed = Date.parse(record.observedAt ?? record.observed_at);
    if (!Number.isFinite(observed) || observed < Date.parse(from) || observed > Date.parse(now)) continue;
    const id = record.id ?? record.record_id;
    const tenant = record.tenantId ?? record.tenant_id;
    const expectedId = 'planned-action-decision:' + p.executionId;
    const valid = (record.type ?? record.record_type) === 'Evidence'
      && (record.kind ?? record.record_kind) === 'evidence'
      && tenant === 'canonical' && record.status === 'OBSERVED'
      && typeof id === 'string' && id === expectedId && SAFE_ID.test(id)
      && SAFE_ID.test(p.agentId ?? '') && SHA.test(record.sourceRevision ?? record.source_revision ?? '')
      && /^[a-f0-9]{64}$/.test(p.actionHmacSha256 ?? '')
      && (RUN.test(p.sourceRef ?? '') || PR.test(p.sourceRef ?? ''))
      && Array.isArray(p.matchedRuleIds) && p.matchedRuleIds.every(x => RULE.test(x))
      && Array.isArray(p.blockedRuleIds) && p.blockedRuleIds.every(x => RULE.test(x))
      && p.blockedRuleIds.every(x => p.matchedRuleIds.includes(x))
      && p.blocked === (p.blockedRuleIds.length > 0);
    if (!valid) { invalidObservations++; continue; }
    if (seen.has(id)) conflicted.add(id);
    else seen.set(id, record);
  }
  const queue = [...seen.entries()].filter(([id]) => !conflicted.has(id)).map(([id,record]) => {
    const p = record.payload, runMatch = p.sourceRef.match(RUN), prMatch = p.sourceRef.match(PR);
    return {
      decisionRecordId: id,
      agentId: p.agentId,
      sourceRef: p.sourceRef,
      sourceUrl: runMatch
        ? 'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/' + runMatch[1]
        : 'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/' + prMatch[1],
      sourceRevision: record.sourceRevision ?? record.source_revision,
      observedAt: record.observedAt ?? record.observed_at,
      // The identity digest is never an independent expected-rule label.
      actionHmacSha256: p.actionHmacSha256,
      observedMatchedRuleIds: dedupe(p.matchedRuleIds),
      blockedRuleIds: dedupe(p.blockedRuleIds),
      guardBlocked: p.blocked,
      reviewCount: reviewCounts.get(id) ?? 0,
      reviewerEvidencePath: REVIEW_FILE_ROOT + id + '.json',
      state: reviewCounts.has(id) ? 'REVIEW_PRESENT_CHECK_PROVIDER_AUTH' : 'PENDING_INDEPENDENT_REVIEW',
    };
  }).sort((a,b) => a.observedAt.localeCompare(b.observedAt));
  return {
    contract: EVALUATION_CONTRACT, generatedAt: now,
    window: {from,to:now,days},
    source: 'existing public.brain_records (read-only)',
    counts: { observed: queue.length, pending: queue.filter(x=>x.reviewCount===0).length, submittedUnverified: queue.filter(x=>x.reviewCount>0).length,
      invalidObservations, conflictingObservationIds: conflicted.size,
      safeObserved: queue.filter(x=>!x.guardBlocked).length, blockedObserved: queue.filter(x=>x.guardBlocked).length,
      distinctAgents: new Set(queue.map(x=>x.agentId)).size },
    queue,
    metrics: evaluatePlannedActionRecall(records, {from, to:now}),
    requirement: 'NO RECALL OR PRECISION UNTIL EXTERNALLY AUTHENTICATED INDEPENDENT REVIEW AND REPRESENTATIVE POSITIVE/NEGATIVE CASES',
  };
}

function authenticatedFetch(fetchImpl, token, url) {
  return fetchImpl(url, {
    headers: {Authorization:'Bearer ' + token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},
    signal:AbortSignal.timeout(12000),
  });
}
async function checkedJson(fetchImpl,token,path) {
  const res=await authenticatedFetch(fetchImpl,token,'https://api.github.com/repos/arthurprinsen-ai/Bedrijfsgeheugen/'+path);
  if (!res.ok) throw Error('INDEPENDENT_REVIEW_GITHUB_READ_HTTP_' + res.status);
  return res.json();
}

// Independently authorized and committed on the already-protected main branch:
// only an APPROVED GitHub review by a different identity on the exact head can
// attest the submitted label; self-declared BRAIN booleans never suffice.
export async function verifyIndependentGithubAttestation(review, decision, {githubToken,fetchImpl=globalThis.fetch}={}) {
  const payload=review?.payload, observed=decision?.payload;
  if (!githubToken || !payload || !observed) return false;
  const match=String(payload.evidenceRef ?? '').match(REVIEW_PR_URL);
  const login=String(payload.reviewerId ?? '').replace(/^github:/,'');
  if (!match || !/^[a-zA-Z0-9-]{1,39}$/.test(login)
      || !String(payload.reviewerId).startsWith('github:') || !SAFE_ID.test(payload.decisionRecordId ?? '')
      || payload.decisionRecordId !== (decision.id ?? decision.record_id)
      || !Array.isArray(payload.expectedRuleIds) || !payload.expectedRuleIds.every(x => RULE.test(x))
      || payload.independent !== true || review.verified !== true
      || (review.tenantId ?? review.tenant_id) !== (decision.tenantId ?? decision.tenant_id)
      || login.toLowerCase() === String(observed.agentId).toLowerCase()) return false;
  const prNumber=match[1], requiredFile=REVIEW_FILE_ROOT + payload.decisionRecordId + '.json';
  try {
    const [pr, reviews, files]=await Promise.all([
      checkedJson(fetchImpl,githubToken,'pulls/'+prNumber),
      checkedJson(fetchImpl,githubToken,'pulls/'+prNumber+'/reviews?per_page=100'),
      checkedJson(fetchImpl,githubToken,'pulls/'+prNumber+'/files?per_page=100'),
    ]);
    if (pr.state!=='closed' || pr.merged!==true || pr.base?.ref!=='main'
        || pr.head?.repo?.full_name!=='arthurprinsen-ai/Bedrijfsgeheugen'
        || !SHA.test(pr.head.sha ?? '') || !SHA.test(pr.merge_commit_sha ?? '')
        || !Array.isArray(reviews) || !Array.isArray(files)
        || !files.some(x=>x.filename===requiredFile && x.status==='added')
        || files.length!==1) return false;
    const reviewerEvents=reviews.filter(x=>x.user?.login?.toLowerCase()===login.toLowerCase()
      && x.commit_id===pr.head.sha).sort((a,b)=>Date.parse(a.submitted_at)-Date.parse(b.submitted_at));
    if (reviewerEvents.at(-1)?.state!=='APPROVED') return false;
    if (pr.user?.login?.toLowerCase()===login.toLowerCase()) return false;
    const file=await checkedJson(fetchImpl,githubToken,'contents/'+requiredFile+'?ref='+pr.merge_commit_sha);
    if (file.type!=='file' || file.encoding!=='base64' || typeof file.content!=='string') return false;
    const data=JSON.parse(Buffer.from(file.content.replace(/\s/g,''),'base64').toString('utf8'));
    return data.contract==='PLANNED_ACTION_INDEPENDENT_REVIEW_V1'
      && data.decisionRecordId===payload.decisionRecordId
      && data.reviewerId===payload.reviewerId
      && data.actionHmacSha256===observed.actionHmacSha256
      && data.sourceRef===observed.sourceRef
      && data.sourceRevision===(decision.sourceRevision ?? decision.source_revision)
      && JSON.stringify(dedupe(data.expectedRuleIds ?? []))===JSON.stringify(dedupe(payload.expectedRuleIds))
      && data.evidenceRef===payload.evidenceRef;
  } catch { return false; }
}

// The evaluator remains synchronous to keep its semantics testable. Only
// already provider-confirmed exact reviewer/decision pairs may count.
export async function evaluateApprovedCanonicalReviews(records,{githubToken,fetchImpl=globalThis.fetch,now,days=30}={}) {
  const queue=compileIndependentReviewQueue(records,{now,days});
  const trusted=new Set();
  const byId=new Map(records.filter(r=>r?.payload?.contract===OBSERVATION_CONTRACT).map(r=>[r.id??r.record_id,r]));
  for(const review of records.filter(r=>r?.payload?.contract===REVIEW_CONTRACT)) {
    const decision=byId.get(review.payload?.decisionRecordId);
    if (!decision) continue;
    if(await verifyIndependentGithubAttestation(review,decision,{githubToken,fetchImpl}))
      trusted.add((review.id??review.record_id) + ':' + (decision.id??decision.record_id));
  }
  const verdict=evaluatePlannedActionRecall(records,{
    from:queue.window.from,to:queue.window.to,
    verifyIndependentReview:(review,decision)=>trusted.has((review.id??review.record_id)+':'+(decision.id??decision.record_id))
  });
  return {...queue,metrics:verdict,independentAttestationsVerified:trusted.size};
}
