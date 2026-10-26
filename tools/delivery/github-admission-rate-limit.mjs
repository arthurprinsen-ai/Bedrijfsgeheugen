// Pure admission classification. Never retry installation-wide rate limits
// in a tight loop: a bounded later attempt belongs to the existing watchdog.
// Do not misclassify authentication/permissions 403 as rate exhaustion.
const details=error=>[
 error?.message,error?.stderr,error?.stdout
].filter(Boolean).join('\n').slice(0,8000);

export function classifyGitHubAdmissionReadError(error){
 const message=details(error);
 const rate=/\b(?:API rate limit exceeded(?: for installation)?|secondary rate limit|rate limit exceeded|exceeded (?:a|the) secondary rate limit|abuse detection mechanism)\b/i.test(message);
 const tooMany=/\b(?:HTTP(?:Error)?[ :]+429|status(?: code)?[ :]+429)\b/i.test(message);
 if(rate||tooMany)return Object.freeze({
   state:'CONTROL_PLANE_RATE_LIMITED',
   fingerprint:'github-installation-api-rate-limited-v1',
   retry_immediately:false,
   next_action:'DEFER_TO_EXISTING_BOUNDED_WATCHDOG_AFTER_RATE_RESET',
   category:'PROVIDER_READ_CAPACITY'
 });
 const transport=/HTTP\s+(?:502|503|504)\b|upstream connect error|connection (?:refused|reset)|ECONNRESET|ETIMEDOUT|socket hang up/i.test(message);
 if(transport)return Object.freeze({
   state:'CONTROL_PLANE_API_UNAVAILABLE',
   fingerprint:'github-api-transient-unavailable-v1',
   retry_immediately:true,
   next_action:'EXISTING_BOUNDED_READ_RETRY',
   category:'PROVIDER_TRANSPORT'
 });
 return Object.freeze({
   state:'CONTROL_PLANE_ADMISSION_ERROR',
   fingerprint:'delivery-hygiene-admission-error-v1',
   retry_immediately:false,
   next_action:'INSPECT_CANONICAL_ADMISSION_PROOF',
   category:'CONTROL_PLANE_FAILURE'
 });
}
