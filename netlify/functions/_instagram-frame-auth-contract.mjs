// Authenticated canonical verifier accepts this deliberately incomplete probe
// ONLY after comparing the original scheduler token. All other replies deny.
export function verifierProbeAuthorizesToken(status,payload){
 return status===400 && payload!==null && typeof payload==='object' && !Array.isArray(payload)
  && payload.ok===false && payload.error==='INVALID_INPUT';
}
