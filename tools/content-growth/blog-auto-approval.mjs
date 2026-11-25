#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import {
  BLOG_AUTO_APPROVAL_VERSION,
  BLOG_VETO_WINDOW_HOURS,
  decideBlogAutoApproval,
} from '../../supabase/functions/_shared/blog-auto-approval.mjs';

const DEFAULT_URL = 'https://adhjwmvyoixzjtmiroln.supabase.co';
const businessDate = (now) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(now);

export async function runBlogAutoApproval({
  date, now = new Date(), env = process.env, fetchImpl = fetch, dryRun = false,
} = {}) {
  const key = String(env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!key) throw new Error('BLOG_AUTO_APPROVAL_SERVICE_AUTH_NOT_CONFIGURED');
  const base = String(env.SUPABASE_URL || DEFAULT_URL).replace(/\/$/, '');
  const today = businessDate(now);
  const runDate = date || today;
  const headers = { apikey: key, authorization: 'Bearer ' + key, 'content-type': 'application/json' };

  const read = async (path) => {
    const response = await fetchImpl(base + '/rest/v1/' + path, { headers });
    if (!response.ok) throw new Error('BLOG_AUTO_APPROVAL_READ_FAILED:' + path.split('?')[0] + ':' + response.status);
    const rows = await response.json();
    return Array.isArray(rows) ? rows[0] || null : null;
  };

  const [obligation, artifact, decision] = await Promise.all([
    read('content_publication_obligations?tenant_id=eq.canonical&channel=eq.blog&publication_date=eq.' + runDate
      + '&select=publication_date,status,slug,content_id,canonical_url,generated_at,evidence&limit=1'),
    read('powerhouse_content_artifacts?channel=eq.blog&run_date=eq.' + runDate + '&select=title,body,cta,status&limit=1'),
    read('powerhouse_channel_decisions?channel=eq.blog&run_date=eq.' + runDate + '&select=decision,state&limit=1'),
  ]);

  const result = decideBlogAutoApproval({ obligation, artifact, decision, now, today });
  if (result.action !== 'APPROVE' || dryRun) return { ...result, written: false };

  const response = await fetchImpl(base + '/rest/v1/rpc/record_content_publication_state', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      p_tenant_id: 'canonical',
      p_publication_date: runDate,
      p_channel: 'blog',
      p_status: 'APPROVED',
      p_content_id: obligation.content_id,
      p_slug: obligation.slug,
      p_canonical_url: obligation.canonical_url || null,
      p_evidence: {
        auto_approval: {
          version: BLOG_AUTO_APPROVAL_VERSION,
          approved_at: now.toISOString(),
          veto_window_hours: BLOG_VETO_WINDOW_HOURS,
          eligible_at: result.eligible_at,
          gates: result.gates,
          veto_instruction: 'Set content_publication_obligations.evidence.veto = {"active": true, "reason": "..."} '
            + 'before eligible_at to stop publication; after approval pull the blog back via the protected PR.',
        },
      },
      p_metrics: {},
      p_next_action: 'Canonical hourly GitHub publisher -> same-date protected candidate -> required checks -> merge -> Netlify -> exact public readback.',
      p_error: null,
    }),
  });
  if (!response.ok) throw new Error('BLOG_AUTO_APPROVAL_WRITE_FAILED:' + response.status);
  return { ...result, written: true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const date = args.find((arg) => /^\d{4}-\d{2}-\d{2}$/.test(arg));
  runBlogAutoApproval({ date, dryRun })
    .then((result) => {
      console.log('BLOG_AUTO_APPROVAL:' + result.code + ':' + result.runDate
        + ':action=' + result.action + ':written=' + result.written
        + (result.eligible_at ? ':eligible_at=' + result.eligible_at : ''));
    })
    .catch((error) => {
      console.error('::error::' + error.message);
      process.exit(1);
    });
}
