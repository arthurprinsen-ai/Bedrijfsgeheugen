export const RECOVERY_STATES = Object.freeze({ DIAGNOSE:'Diagnose', PREPARE:'Prepare', EXECUTE:'Execute', VERIFY:'Verify', RESOLVED:'Resolved', ESCALATED:'Escalated' });

export function planSelfHeal({ knownPattern, risk, reversible, regressionTestAvailable, verificationAvailable }) {
  if (!knownPattern) return Object.freeze({ state:RECOVERY_STATES.ESCALATED, reason:'UNKNOWN_PATTERN' });
  if (risk === 'High') return Object.freeze({ state:RECOVERY_STATES.ESCALATED, reason:'HIGH_RISK' });
  if (!reversible || !regressionTestAvailable || !verificationAvailable) return Object.freeze({ state:RECOVERY_STATES.PREPARE, reason:'SAFETY_PRECONDITION_MISSING' });
  return Object.freeze({ state:RECOVERY_STATES.EXECUTE, reason:'KNOWN_SAFE_RECOVERY' });
}

export function verifyRecovery({ regressionPassed, productionSmokePassed, expectedStateObserved }) {
  if (regressionPassed && productionSmokePassed && expectedStateObserved) return Object.freeze({ state:RECOVERY_STATES.RESOLVED, verified:true });
  return Object.freeze({ state:RECOVERY_STATES.ESCALATED, verified:false, reason:'VERIFICATION_FAILED' });
}
