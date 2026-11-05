import { assessOfficialBlogDateTruth } from './blog-official-date-truth.mjs';

// Last-mile publication permission for the daily blog.
// The generator already writes a GENERATED obligation, but nothing moved it to APPROVED,
// so powerhouse-blog-export kept answering BLOG_PUBLIC_EXPORT_NOT_APPROVED and no candidate PR existed.
// This module only decides; it never writes. Content gates stay downstream and unchanged:
// reader-ready check at render, official-date gate at export, protected PR checks before merge.

export const BLOG_AUTO_APPROVAL_VERSION = 'v1-veto-window';
// A 24 hour window would push every blog one day past its own business date and make
// bg-content-publication-daily-assert fail at 18:35 and 19:35 UTC. The blog is generated
// shortly after local midnight, so the window ends in the early morning of the same date.
export const BLOG_VETO_WINDOW_HOURS = 6;

const PUBLISHABLE_DECISION_STATES = ['content_ready', 'scheduled', 'published'];
const PAST_APPROVAL = ['APPROVED', 'DISPATCHED', 'PUBLISHED', 'LIVE_PROVEN', 'MEASURED', 'LEARNED'];
const clean = (value) => String(value ?? '').trim();

function evidenceObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch {
      // not JSON, treat as empty
    }
  }
  return {};
}

export function isBlogVetoed(evidence) {
  const veto = evidenceObject(evidence).veto;
  if (veto === true) return true;
  if (veto && typeof veto === 'object' && !Array.isArray(veto)) return veto.active !== false;
  return false;
}

/**
 * @returns {{action:'APPROVE'|'WAIT'|'SKIP', code:string, runDate:string, eligible_at?:string, gates?:string[]}}
 */
export function decideBlogAutoApproval({
  obligation,
  artifact,
  decision,
  now = new Date(),
  today,
  windowHours = BLOG_VETO_WINDOW_HOURS,
} = {}) {
  const runDate = clean(obligation?.publication_date) || clean(today);
  const skip = (code) => ({ action: 'SKIP', code, runDate });

  if (!obligation) return skip('NO_OBLIGATION');
  const status = clean(obligation.status);
  if (PAST_APPROVAL.includes(status)) return skip('ALREADY_PAST_APPROVAL');
  if (status !== 'GENERATED') return skip('NOT_GENERATED');
  if (isBlogVetoed(obligation.evidence)) return skip('VETOED');
  if (!clean(obligation.slug) || !clean(obligation.content_id)) return skip('LINEAGE_MISSING');

  const date = clean(today);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return skip('INVALID_TODAY');
  if (runDate < date) return skip('STALE_REQUIRES_REVIEW');
  if (runDate > date) return skip('NOT_DUE');

  if (!artifact || !decision || clean(decision.decision) !== 'publish'
    || !PUBLISHABLE_DECISION_STATES.includes(clean(decision.state))) {
    return skip('NO_PUBLISHABLE_ARTIFACT');
  }

  const fact = assessOfficialBlogDateTruth({
    title: artifact.title, body: artifact.body, cta: artifact.cta, runDate,
  });
  if (!fact.ok) return skip('FACT_GATE:' + clean(fact.code));

  const generatedAt = Date.parse(clean(obligation.generated_at));
  if (!Number.isFinite(generatedAt)) return skip('GENERATED_AT_MISSING');
  const eligibleAt = new Date(generatedAt + windowHours * 3600 * 1000);
  const nowMs = now instanceof Date ? now.getTime() : Date.parse(String(now));
  if (nowMs < eligibleAt.getTime()) {
    return { action: 'WAIT', code: 'VETO_WINDOW_OPEN', runDate, eligible_at: eligibleAt.toISOString() };
  }
  return {
    action: 'APPROVE',
    code: 'APPROVED_AFTER_VETO_WINDOW',
    runDate,
    eligible_at: eligibleAt.toISOString(),
    gates: ['obligation_generated', 'no_veto', 'lineage_present', 'same_business_date',
      'publish_decision', 'official_date_truth', 'veto_window_elapsed'],
  };
}
