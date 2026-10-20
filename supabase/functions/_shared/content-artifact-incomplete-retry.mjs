// Only a genuinely incomplete strict JSON artifact is eligible for one larger-budget retry.
// Never treat arbitrary schema/identity/content errors as retryable or approved.
export function incompleteStructuredArtifactReason(response, parseError=null) {
  if (response?.status === 'incomplete' && response?.incomplete_details?.reason === 'max_output_tokens') {
    return 'MAX_OUTPUT_TOKENS';
  }
  if (parseError instanceof SyntaxError && /(?:unterminated string|unexpected end(?: of (?:json input|data))?|end of json input)/i.test(String(parseError.message))) {
    return 'INCOMPLETE_JSON';
  }
  return null;
}
export function largerArtifactTokenBudget(initial) {
  if (!Number.isInteger(initial) || initial <= 0) throw new RangeError('INITIAL_ARTIFACT_BUDGET_INVALID');
  return Math.min(8000, Math.max(initial * 2, 3200));
}
