// A transient document request is no longer an unresolved core request ONLY
// when the final, successfully loaded document is the same canonical route.
// Netlify can redirect /blog/slug -> /blog/slug/ during browser navigation.
// This deliberately does not normalize other path differences.
function canonicalDocumentPath(pathname){
  if(typeof pathname!=='string'||!pathname.startsWith('/'))return null;
  return pathname==='/'?'/':pathname.replace(/\/$/,'');
}

export function filterSettledCoreFailures(failedCore,{status,finalUrl}={}){
  // 3xx is not a settled document. A rendered 2xx document is mandatory.
  if(!Number.isInteger(status)||status<200||status>=300||!finalUrl)return [...failedCore];
  let finalPath=null;
  try{
    const parsed=new URL(finalUrl);
    if(!['http:','https:'].includes(parsed.protocol))return [...failedCore];
    finalPath=canonicalDocumentPath(parsed.pathname||'/');
  }catch{return [...failedCore];}
  if(!finalPath)return [...failedCore];

  // HTTP/2 PING can fail on a retired connection while retry delivers the same final 2xx HTML.
  // Never suppress it on an unresolved navigation, other URL, script or stylesheet.
  const transientDocumentFailure=/^(?:net::ERR_CONNECTION_RESET|net::ERR_HTTP2_PING_FAILED|net::ERR_ABORTED|NS_ERROR_ABORT|Load request cancelled)$/i;
  return failedCore.filter(value=>{
    const match=String(value).match(/^document:([^:]*):(.*)$/);
    if(!match)return true; // Preserve all script, stylesheet and unknown failures.
    const [,pathname,errorText]=match;
    return !(canonicalDocumentPath(pathname)===finalPath&&transientDocumentFailure.test(errorText));
  });
}
