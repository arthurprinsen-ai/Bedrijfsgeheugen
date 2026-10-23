/** Require the same tenant bearer token that Portal V2 uses for canonical state. */
export async function tenantAiAuthorizationHeaders(stateClient,extra={}){
  if(stateClient?.isDemo?.()||typeof stateClient?.authHeaders!=='function')throw new Error('AUTH_TOKEN_UNAVAILABLE');
  const identity=await stateClient.authHeaders();
  const authorization=identity?.authorization;
  if(typeof authorization!=='string'||!/^Bearer\s+\S+$/i.test(authorization))throw new Error('AUTH_TOKEN_UNAVAILABLE');
  // Neither an untrusted caller nor a shared browser cookie may replace the signed user token.
  return {...identity,...extra,authorization};
}
