export function classifyEdgeFunctionDomain(slug) {
  const s = String(slug || '').toLowerCase();
  if (/(social|linkedin|instagram|buffer|outreach|message|publisher|composio)/.test(s)) return 'social';
  if (/(content|blog|seo|native-content|pre-publish|publish)/.test(s)) return 'content';
  if (/(revenue|growth|sales|lead|commercial|opdrachten)/.test(s)) return 'commercial';
  if (/(portal|cockpit|cms|client|customer)/.test(s)) return 'portal';
  if (/(brain|predictive|forecast|model|intelligence|advisor)/.test(s)) return 'brain';
  if (/(ops|migration|repair|sync|webhook|ingest|cron|scheduler|recovery)/.test(s)) return 'operations';
  return 'unclassified';
}

export function evaluateFunctionDeletion(item) {
  const blockers = [];
  if (item.deprecation_state !== 'deprecated') blockers.push('not-deprecated');
  if (item.caller_evidence !== 'zero-call-window') blockers.push('caller-evidence-missing');
  if (item.replacement_live_proven !== true) blockers.push('replacement-not-proven');
  if (item.deletion_approved !== true) blockers.push('approval-required');
  return { deleteEligible: blockers.length === 0, blockers };
}
