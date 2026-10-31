// Original ONE BRAIN/Heartbeat statuses are observations, never display-only successes.
// Pure, read-only projection used by existing Portal V2 error, filter and timeline UI.
// Explicit denial and evidence-debt states outrank substrings such as "verified", "live"
// and "success": UNVERIFIED, NOT_LIVE and UNSUCCESSFUL must NEVER look green.
export function classifyPowerhouseTone(status, severity) {
  const s=String(status??'').trim().toLowerCase();
  const v=String(severity??'').trim().toLowerCase();
  const statusWords=s.split(/[^a-z0-9]+/).filter(Boolean);
  const severityWords=v.split(/[^a-z0-9]+/).filter(Boolean);
  const any=(words,terms)=>words.some(word=>terms.includes(word));
  const severe=['red','bad','critical','error','failed','failure','blocked','blocking','degraded','overdue','unhealthy','revoked','denied'];
  const caution=['amber','orange','yellow','warn','warning','pending','stale','open','queued','queue','missing','unverified','unproven','unfulfilled','unsuccessful','not','no','unknown_proof','skipped','partial'];
  if(any(severityWords,severe)||any(statusWords,severe)||
     s.includes('recovery_due')||s.includes('drift')||s.includes('not_live_verified'))return 'bad';
  // NOT_REQUIRED is an explicitly inapplicable step, not a warning or a success.
  if((s==='not_required'||s==='not_applicable')&&!v)return 'neutral';
  if(any(severityWords,caution)||any(statusWords,caution)||
     v.includes('warn')||s.includes('pending')||s.includes('stale')||
     s.includes('open')||s.includes('queue')||s.includes('missing')||
     s.includes('not_live')||s.includes('not_proven')||s.includes('proof_due'))
    return 'warn';
  if(s.includes('success')||s.includes('green')||s.includes('verified')||
     s.includes('live')||s.includes('proven')||s.includes('fulfilled'))return 'good';
  return 'neutral';
}
