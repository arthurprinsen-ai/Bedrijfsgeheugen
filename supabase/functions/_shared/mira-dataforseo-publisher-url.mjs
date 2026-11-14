// Original DataForSEO Google News source URL bridge: explicit publisher URL only.
// This is NOT a Google redirect follower, Google News decoder, publisher,
// source approval, second search, or HTML scraper. All existing Mira source
// quality, dated provenance, PH-P, scoring and 90-day/3-day dedupe remain active.
import {classifyMiraSourceUrl} from './mira-source-url-quality.mjs';

const GOOGLE_WRAPPERS = new Set(['google.com','google.nl']);
const normaliseHost=(s)=>String(s||'').trim().toLowerCase().replace(/^www\./,'').replace(/\.$/,'');
const isUnsafeHost=(host)=>
  !host||!host.includes('.')||host==='localhost'||host.endsWith('.localhost')||
  host.endsWith('.local')||host.endsWith('.internal')||
  host.startsWith('[')||/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);

const shape=(value)=>{
  try {
    const u=new URL(String(value||''));
    return {host:normaliseHost(u.hostname),path:u.pathname.slice(0,80),
      parameter_keys:[...new Set([...u.searchParams.keys()])].sort().slice(0,12)};
  } catch { return {host:'',path:'INVALID',parameter_keys:[]}; }
};

export function resolveMiraNewsPublisherUrl({url,providerDomain}={}){
  const original=String(url||'').trim();
  if(classifyMiraSourceUrl(original).ok){
    return Object.freeze({ok:true,url:original,kind:'DIRECT_PUBLISHER_URL',source_url_shape:shape(original)});
  }

  const reject=(code)=>Object.freeze({ok:false,url:null,code,source_url_shape:shape(original)});
  let wrapper;
  try {wrapper=new URL(original)}catch{return reject('SOURCE_URL_INVALID')}
  const wrapperHost=normaliseHost(wrapper.hostname);
  if(!GOOGLE_WRAPPERS.has(wrapperHost) || wrapper.protocol!=='https:' || wrapper.pathname!=='/url')
    return reject('GOOGLE_URL_NOT_EXPLICIT_PUBLISHER_REDIRECT');

  // Google /url?url=https%3A... or /url?q=https%3A... is acceptable
  // ONLY when the original provider declares the exact publisher host.
  const targets=[wrapper.searchParams.get('url'),wrapper.searchParams.get('q')]
    .map(x=>String(x||'').trim()).filter(Boolean);
  if(targets.length<1 || new Set(targets).size>1)
    return reject('EXPLICIT_PUBLISHER_URL_MISSING_OR_CONFLICT');

  const declaredHost=normaliseHost(providerDomain);
  if(isUnsafeHost(declaredHost)||GOOGLE_WRAPPERS.has(declaredHost))
    return reject('INDEPENDENT_PUBLISHER_DOMAIN_MISSING');
  let target;
  try {target=new URL(targets[0])}catch{return reject('EXPLICIT_PUBLISHER_URL_INVALID')}
  const targetHost=normaliseHost(target.hostname);
  if(target.protocol!=='https:'||target.username||target.password||target.port
      ||isUnsafeHost(targetHost)
      ||!(targetHost===declaredHost||targetHost.endsWith('.'+declaredHost))
      ||target.pathname.length<2)
    return reject('EXPLICIT_PUBLISHER_HOST_OR_SCHEME_UNVERIFIED');
  target.hash='';
  if(!classifyMiraSourceUrl(target.toString()).ok)
    return reject('EXPLICIT_PUBLISHER_FAILED_ORIGINAL_SOURCE_URL_GATE');
  return Object.freeze({ok:true,url:target.toString(),kind:'GOOGLE_WRAPPER_VERIFIED_PUBLISHER_URL',
    source_url_shape:shape(original)});
}
