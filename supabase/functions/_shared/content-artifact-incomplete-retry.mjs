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

// A revision is still an unsubmitted draft. Retry exactly once, ONLY if the
// caller proves that the structured model output was genuinely truncated.
// Provider failures, invalid schema, poor editorial content or incomplete
// evidence must remain blocked and never acquire an extra retry.
export async function retryIncompleteEditorialDraft(generate, initialBudget, isIncomplete, budgetForRetry, onRetry=()=>{}) {
  try {
    return await generate(initialBudget);
  } catch (error) {
    if (!isIncomplete(error)) throw error;
    const nextBudget=budgetForRetry(initialBudget);
    if (!Number.isFinite(nextBudget)||nextBudget<=initialBudget) throw error;
    onRetry(initialBudget,nextBudget);
    return await generate(nextBudget);
  }
}
