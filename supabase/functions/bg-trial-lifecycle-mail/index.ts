import { createClient } from 'npm:@supabase/supabase-js@2';
import { composeTrialMail, pickVariant, sampleContexts, MAIL_KEYS, optOutRequested } from '../_shared/trial-lifecycle-mail.mjs';

const C = 'bg-trial-lifecycle-mail-v1', B = 'https://backend.composio.dev/api/v3.1';
const OWNER_EMAIL = 'arthur.prinsen@gmail.com';
const MAX_PER_RUN = 25;
const s = (v: any) => String(v ?? '').trim();
const J = (b: any, n = 200) => new Response(JSON.stringify(b), { status: n, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
async function sec(db: any, n: string) { const e = Deno.env.get(n); if (e) return s(e); const { data } = await db.rpc('bg_geheim', { p_naam: n }); return s(data); }
function safe(o: any) { try { return JSON.parse(JSON.stringify(o)); } catch { return { unserializable: true }; } }

async function gmailAccount(db: any, key: string) {
  const pinned = await sec(db, 'COMPOSIO_GMAIL_CONNECTED_ACCOUNT_ID');
  const r = await fetch(B + '/connected_accounts?account_type=ALL&limit=100', { headers: { 'x-api-key': key } });
  const x: any = await r.json().catch(() => ({}));
  if (!r.ok) throw { code: 'GMAIL_DISCOVERY', status: r.status };
  const all = x?.items || x?.data?.items || x?.data || [];
  const active = all.filter((z: any) => s(z?.toolkit?.slug || z?.toolkit_slug).toLowerCase() === 'gmail' && s(z?.status).toUpperCase() === 'ACTIVE' && z?.is_disabled !== true);
  if (active.length === 0) throw { code: 'GMAIL_CONNECTION_REQUIRED' };
  let chosen = active[0];
  if (pinned) { const exact = active.find((z: any) => s(z?.id) === pinned || s(z?.word_id) === pinned || s(z?.alias) === pinned); if (exact) chosen = exact; }
  if (active.length > 1 && !pinned) throw { code: 'GMAIL_CONNECTION_AMBIGUOUS' };
  const id = s(chosen?.id), userId = s(chosen?.user_id || chosen?.entity_id);
  if (!id || !userId) throw { code: 'GMAIL_ACCOUNT_IDENTITY_INCOMPLETE' };
  return { id, userId };
}

async function send(key: string, acct: { id: string; userId: string }, to: string, subject: string, body: string) {
  const r = await fetch(B + '/tools/execute/GMAIL_SEND_EMAIL', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key },
    body: JSON.stringify({ connected_account_id: acct.id, user_id: acct.userId, arguments: { recipient_email: to, subject, body, is_html: false, user_id: 'me' } }),
    signal: AbortSignal.timeout(20000),
  });
  const x: any = await r.json().catch(() => ({ parse_error: true }));
  if (!r.ok || x?.successful !== true) throw { code: 'GMAIL_SEND_FAILED', status: r.status, payload: safe(x) };
  const d = x?.data?.data || x?.data || x;
  const message_id = s(d?.id || d?.message_id || d?.messageId || d?.message?.id);
  if (!message_id) throw { code: 'SEND_ACK_MESSAGE_ID_MISSING', payload: safe(d) };
  return { message_id };
}

// Afmeldingen via antwoord: zoekt per proefklant die de afgelopen 14 dagen een mail kreeg naar een "afmelden"-antwoord.
async function checkOptOuts(db: any, key: string, acct: { id: string; userId: string }) {
  const since = new Date(Date.now() - 14 * 864e5).toISOString();
  const { data: sentRows, error } = await db.from('saas_trial_mails').select('email').eq('status', 'sent').gte('sent_at', since);
  if (error) throw { code: 'OPTOUT_QUERY', message: error.message };
  const emails = [...new Set((sentRows || []).map((r: any) => s(r.email).toLowerCase()))];
  const found: any[] = [];
  for (const email of emails) {
    const { data: already } = await db.from('powerhouse_email_contact_suppressions').select('suppression_id').eq('email', email).eq('active', true).maybeSingle();
    if (already) continue;
    const r = await fetch(B + '/tools/execute/GMAIL_FETCH_EMAILS', {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key },
      body: JSON.stringify({ connected_account_id: acct.id, user_id: acct.userId, arguments: { user_id: 'me', query: 'from:' + email + ' newer_than:14d', max_results: 20, include_payload: true, include_spam_trash: false, verbose: true } }),
      signal: AbortSignal.timeout(20000),
    });
    const x: any = await r.json().catch(() => ({}));
    if (!r.ok || x?.successful !== true) { found.push({ email, status: 'fetch_failed' }); continue; }
    const d = x?.data || x;
    const msgs = Array.isArray(d?.messages) ? d.messages : [];
    for (const msg of msgs) {
      const text = s(msg?.messageText || msg?.preview?.body || msg?.snippet);
      if (!optOutRequested(text)) continue;
      const { error: ie } = await db.from('powerhouse_email_contact_suppressions').insert({ email, reason: 'trial_mail_opt_out', active: true });
      found.push({ email, status: ie ? 'suppress_failed' : 'suppressed' });
      break;
    }
  }
  return found;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return J({ ok: false, error: 'POST_ONLY' }, 405);
  const url = Deno.env.get('SUPABASE_URL') || '', role = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !role) return J({ ok: false, error: 'CONFIG' }, 500);
  const db = createClient(url, role, { auth: { persistSession: false, autoRefreshToken: false } });
  const token = await sec(db, 'powerhouse_daily_scheduler_token');
  if (!token || req.headers.get('x-powerhouse-token') !== token) return J({ ok: false, error: 'UNAUTHORIZED' }, 401);
  let input: any = {}; try { input = await req.json(); } catch { /* leeg */ }
  const mode = s(input.mode) || 'preview';
  const now = new Date().toISOString();

  try {
    if (mode === 'samples') {
      const key = await sec(db, 'COMPOSIO_API_KEY'); if (!key) throw { code: 'COMPOSIO_API_KEY_MISSING' };
      const acct = await gmailAccount(db, key);
      const parts: string[] = [];
      for (const mk of MAIL_KEYS) for (const ctx of sampleContexts()) for (const v of ['A', 'B']) {
        const m = composeTrialMail(mk, v, ctx);
        parts.push('=== ' + mk + ' · variant ' + v + ' · ' + ctx.label + ' ===\nOnderwerp: ' + m.subject + '\n\n' + m.body);
      }
      const ack = await send(key, acct, OWNER_EMAIL, '[PROEF] Voorbeelden proefmails (alleen aan jou verstuurd)', parts.join('\n\n\n'));
      return J({ ok: true, contract: C, mode, sent_to: OWNER_EMAIL, message_id: ack.message_id, samples: parts.length });
    }

    if (mode === 'report') {
      const { data, error } = await db.from('saas_trial_mail_learning_v1').select('*');
      if (error) throw { code: 'LEARNING_VIEW', message: error.message };
      const rows = (data || []).map((r: any) => ({ ...r, rate: r.sent > 0 ? Math.round((100 * r.converted_14d) / r.sent) / 100 : null, enough_data: r.sent >= 30 }));
      await db.from('bg_gezondheid').insert({ gemeten_op: now, onderdeel: C, soort: 'learning', status: 'ok', detail: 'varianten=' + rows.length, gegevens: { contract: C, rows } });
      return J({ ok: true, contract: C, mode, rows, rule: 'Geen automatische variantkeuze vóór 30 verzonden mails per variant.' });
    }

    const { data: due, error: de } = await db.rpc('saas_trial_mail_due_v1', { p_now: now });
    if (de) throw { code: 'DUE_QUERY', message: de.message };
    const rows = (due || []).slice(0, MAX_PER_RUN);

    if (mode === 'preview') {
      return J({ ok: true, contract: C, mode, due: rows.length, mails: rows.map((r: any) => ({ to: r.email, mail_key: r.mail_key, ...(composeTrialMail(r.mail_key, pickVariant(r.subscription_id), r) as any) })) });
    }
    if (mode !== 'live') return J({ ok: false, error: 'UNKNOWN_MODE' }, 400);

    const key = await sec(db, 'COMPOSIO_API_KEY'); if (!key) throw { code: 'COMPOSIO_API_KEY_MISSING' };
    const out: any[] = [];
    let acct: { id: string; userId: string } | null = await gmailAccount(db, key);
    const optOuts = await checkOptOuts(db, key, acct);
    for (const r of rows) {
      const to = s(r.email).toLowerCase();
      const { data: blocked } = await db.from('powerhouse_email_contact_suppressions').select('suppression_id').eq('email', to).eq('active', true).maybeSingle();
      const variant = pickVariant(r.subscription_id);
      const m = composeTrialMail(r.mail_key, variant, r);
      const base = { subscription_id: r.subscription_id, organisation_id: r.organisation_id, email: to, mail_key: r.mail_key, variant, segment: m.segment, subject: m.subject };
      if (blocked) {
        await db.from('saas_trial_mails').upsert({ ...base, status: 'skipped', error: 'SUPPRESSED' }, { onConflict: 'subscription_id,mail_key', ignoreDuplicates: true });
        out.push({ to, mail_key: r.mail_key, status: 'skipped' }); continue;
      }
      const { data: claim, error: ce } = await db.from('saas_trial_mails').insert({ ...base, status: 'claimed' }).select('id').maybeSingle();
      if (ce || !claim) { out.push({ to, mail_key: r.mail_key, status: 'already_claimed' }); continue; }
      try {
        acct = acct || await gmailAccount(db, key);
        const ack = await send(key, acct, to, m.subject, m.body);
        await db.from('saas_trial_mails').update({ status: 'sent', provider_message_id: ack.message_id, sent_at: new Date().toISOString() }).eq('id', claim.id);
        out.push({ to, mail_key: r.mail_key, variant, status: 'sent' });
      } catch (e: any) {
        const er = safe(e);
        const uncertain = er?.code === 'SEND_ACK_MESSAGE_ID_MISSING';
        await db.from('saas_trial_mails').update({ status: uncertain ? 'unverified' : 'error', error: JSON.stringify(er).slice(0, 500) }).eq('id', claim.id);
        out.push({ to, mail_key: r.mail_key, status: uncertain ? 'unverified' : 'error', code: er?.code });
      }
    }
    const sent = out.filter((x) => x.status === 'sent').length, bad = out.filter((x) => x.status === 'error' || x.status === 'unverified').length;
    await db.from('bg_gezondheid').insert({ gemeten_op: now, onderdeel: C, soort: 'lifecycle-mail', status: bad > 0 ? 'waarschuwing' : 'ok', detail: 'due=' + rows.length + '; sent=' + sent + '; problemen=' + bad, gegevens: { contract: C, results: out } });
    return J({ ok: true, contract: C, mode, due: rows.length, sent, results: out, opt_outs: optOuts });
  } catch (e: any) {
    const code = typeof e?.code === 'string' ? e.code : 'UNEXPECTED_ERROR';
    await db.from('bg_gezondheid').insert({ gemeten_op: now, onderdeel: C, soort: 'lifecycle-mail', status: 'fout', detail: code, gegevens: { contract: C, code } }).then(() => null, () => null);
    return J({ ok: false, contract: C, error: code }, 500);
  }
});
