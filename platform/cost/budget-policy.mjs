const OPTIONAL_WORK = new Set(['research', 'creative', 'experiment', 'optimization', 'unclassified']);
const RUNNABLE_DECISIONS = new Set(['RUN', 'CHEAP_PATH', 'PROTECTED_INTERRUPT']);

export function requireRunnableBudgetEnvelope(envelope) {
  if (!envelope || envelope.current !== true || !String(envelope.snapshotFingerprint ?? '').trim()) {
    throw new Error('current budget envelope with snapshot fingerprint is required');
  }
  if (!RUNNABLE_DECISIONS.has(envelope.decision)) {
    throw new Error(`budget decision ${String(envelope.decision ?? 'UNKNOWN')} blocks optional work`);
  }
  for (const field of ['remainingCredits', 'dailyAllowance']) {
    const value = Number(envelope[field]);
    if (!Number.isFinite(value) || value < 0) throw new Error(`budget envelope ${field} is invalid`);
  }
  const hasTokenEnvelope = envelope.monthlyTokenLimit !== undefined || envelope.usedTokens !== undefined || envelope.tokenState !== undefined;
  if (hasTokenEnvelope) {
    for (const field of ['remainingTokens', 'dailyTokenAllowance']) {
      const value = Number(envelope[field]);
      if (!Number.isFinite(value) || value < 0) throw new Error(`budget envelope ${field} is invalid`);
    }
    if (['RED', 'EXHAUSTED'].includes(envelope.tokenState) && envelope.decision !== 'PROTECTED_INTERRUPT') {
      throw new Error('budget decision blocks optional work because token envelope is exhausted');
    }
  }
  return envelope;
}

function calendarPosition(now) {
  const instant = new Date(now);
  if (!Number.isFinite(instant.getTime())) return null;

  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(instant).filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, Number(value)]));
  const daysInMonth = new Date(Date.UTC(parts.year, parts.month, 0)).getUTCDate();
  return { dayOfMonth: parts.day, daysInMonth };
}

const STATE_ORDER = Object.freeze({ GREEN:0, ORANGE:1, RED:2, EXHAUSTED:3 });

function resourceState({ limit, used, dailyBurn, remainingDays }) {
  const remaining = Math.max(0, limit - used);
  const dailyAllowance = remaining / remainingDays;
  const paceRatio = dailyBurn > 0 && dailyAllowance > 0 ? dailyBurn / dailyAllowance : used / limit;
  const state = used >= limit || paceRatio >= 1 ? 'EXHAUSTED' : paceRatio >= 0.90 ? 'RED' : paceRatio >= 0.70 ? 'ORANGE' : 'GREEN';
  return { remaining, dailyAllowance, paceRatio, state };
}

export function evaluateBudget(input = {}) {
  const monthlyLimit = Number(input.monthlyLimit);
  const usedCredits = Number(input.usedCredits);
  const position = calendarPosition(input.now);
  if (!(monthlyLimit > 0) || !(usedCredits >= 0) || !position || typeof input.workClass !== 'string') {
    throw new TypeError('valid monthly budget input required');
  }

  const remainingDays = Math.max(1, position.daysInMonth - position.dayOfMonth + 1);
  const dailyBurn = Number(input.dailyBurn);
  const credit = resourceState({ limit:monthlyLimit, used:usedCredits, dailyBurn, remainingDays });
  const hasTokenEnvelope = input.monthlyTokenLimit !== undefined || input.usedTokens !== undefined;
  let token = null;
  if (hasTokenEnvelope) {
    const monthlyTokenLimit = Number(input.monthlyTokenLimit);
    const usedTokens = Number(input.usedTokens);
    const dailyTokenBurn = Number(input.dailyTokenBurn);
    if (!(monthlyTokenLimit > 0) || !(usedTokens >= 0)) throw new TypeError('valid monthly token budget input required');
    token = resourceState({ limit:monthlyTokenLimit, used:usedTokens, dailyBurn:dailyTokenBurn, remainingDays });
  }
  const state = token && STATE_ORDER[token.state] > STATE_ORDER[credit.state] ? token.state : credit.state;

  if (input.protectedInterrupt === true) {
    return Object.freeze({
      state, creditState:credit.state, tokenState:token?.state ?? 'UNMETERED',
      remainingCredits:credit.remaining, dailyAllowance:credit.dailyAllowance, paceRatio:credit.paceRatio,
      remainingTokens:token?.remaining ?? null, dailyTokenAllowance:token?.dailyAllowance ?? null, tokenPaceRatio:token?.paceRatio ?? null,
      decision:'PROTECTED_INTERRUPT', reason:'PROTECTED_OUTCOME',
    });
  }

  const optional = OPTIONAL_WORK.has(input.workClass.toLowerCase());
  const decision = optional && (state === 'RED' || state === 'EXHAUSTED')
    ? 'BUDGET_DEFERRED'
    : state === 'ORANGE'
      ? 'CHEAP_PATH'
      : 'RUN';
  return Object.freeze({
    state,
    creditState:credit.state,
    tokenState:token?.state ?? 'UNMETERED',
    remainingCredits:credit.remaining,
    dailyAllowance:credit.dailyAllowance,
    paceRatio:credit.paceRatio,
    remainingTokens:token?.remaining ?? null,
    dailyTokenAllowance:token?.dailyAllowance ?? null,
    tokenPaceRatio:token?.paceRatio ?? null,
    decision,
    reason: decision === 'BUDGET_DEFERRED'
      ? token && ['RED','EXHAUSTED'].includes(token.state) && !['RED','EXHAUSTED'].includes(credit.state)
        ? 'MONTHLY_TOKEN_BUDGET_GUARD'
        : 'MONTHLY_BUDGET_GUARD'
      : 'WITHIN_POLICY',
  });
}
