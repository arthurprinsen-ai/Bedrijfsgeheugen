/** Classify evidence for existing Portal V2 readback; this never changes HTTP success,
 * disables provider security, follows challenge URLs, or authorizes any request.
 */
export const PORTAL_BROWSER_SECURITY_CHALLENGE_VERSION='portal-browser-security-challenge-v1';

export function classifyPortalBrowserReadback({status,html=''}={}){
 const code=Number(status);
 if(!Number.isInteger(code)||code<100||code>599)return 'INVALID_HTTP_STATUS';
 const body=String(html||'');
 if(code===403 && /we are verifying your connection\.?/i.test(body)
     && /security by[\s\S]*?netlify/i.test(body))
   return 'NETLIFY_SECURITY_CHALLENGE';
 return code<400?'HTTP_OK':'HTTP_ERROR';
}
