// Pure source validation for the EXISTING Powerhouse relationship research worker.
// Explicit public business mailto + exact named person and company on the source page.
// No inferred addresses, gated platforms, scraping APIs, send authority or PII in logs.
const FREE_MAIL=new Set(['gmail.com','outlook.com','hotmail.com','yahoo.com','live.nl','icloud.com','proton.me','protonmail.com','mail.com','aol.com']);
const GENERIC=/^(info|contact|hello|sales|support|office|admin|receptie|reception|hr|jobs|team|marketing|service|noreply|no-reply|privacy|hello|recruitment|recruiting|careers)([.+_-]|@)/i;
const EXCLUDED_HOST=/(^|\.)(linkedin|facebook|instagram|tiktok|google|bing|youtube|reddit|indeed|glassdoor|jobbird|monsterboard|apollo|hunter|rocketreach|signalhire|zoominfo|lusha|wikipedia)\.(com|nl|net|org|co\.uk)$/i;
const ascii=v=>String(v??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&amp;/g,' and ').replace(/[^a-z0-9]+/g,' ').trim();
// Conservative, bounded HTML text scanner. Do not use tag-stripping
// regular expressions: malformed closing tags could leak script/style
// code into the person/company identity evidence.
function textOnly(html){
 const source=String(html??'');
 let out='', hidden=null, i=0;
 while(i<source.length){
  if(source[i]!=='<'){
   if(!hidden)out+=source[i];
   i++;
   continue;
  }
  let j=i+1, quote=null;
  for(;j<source.length;j++){
   const ch=source[j];
   if(quote){if(ch===quote)quote=null;continue;}
   if(ch==='"'||ch==="'"){quote=ch;continue;}
   if(ch==='>')break;
  }
  if(j>=source.length)break;
  const inside=source.slice(i+1,j).trim().toLowerCase();
  const closing=inside.startsWith('/');
  const name=(closing?inside.slice(1).trim():inside).match(/^[a-z0-9-]+/)?.[0]??'';
  if(hidden){
   if(closing&&name===hidden)hidden=null;
  }else if(!closing&&['script','style','template','noscript','svg'].includes(name)){
   hidden=name;
  }
  out+=' ';
  i=j+1;
 }
 return out.replace(/&(?:nbsp|amp|quot|apos|lt|gt);/gi,' ');
}
function sourceURL(raw){
 try {
  const u=new URL(String(raw??''));
  const h=u.hostname.toLowerCase();
  if(u.protocol!=='https:'||u.username||u.password||!h||!h.includes('.')||u.port&&u.port!=='443'||
   h.endsWith('.local')||h.endsWith('.internal')||h.endsWith('.localhost')||
   h==='localhost'||EXCLUDED_HOST.test(h)||/^(?:\d{1,3}\.){3}\d{1,3}$/.test(h)||
   h.startsWith('127.')||h.startsWith('10.')||h.startsWith('192.168.')||h.startsWith('169.254.')||
   /^172\.(?:1[6-9]|2\d|3[01])\./.test(h)||h==='0.0.0.0')return null;
  return u;
 } catch{return null}
}

// Canonical no-cost page targets, bounded to public, first-party company domains.
// Existing same-domain public page evidence is preferred over external search APIs.
export function publicCompanyContactPaths(domain){
 const u=sourceURL('https://'+String(domain||'').trim()+'/');
 if(!u)return [];
 return ['/over-ons/','/team/','/contact/'].map(path=>new URL(path,u).toString());
}
// A redirect may only canonicalize the same company domain (for example
// barnes.nl -> www.barnes.nl). Never follow to another company, cloud metadata,
// private IP, auth URL, external short-link, or non-HTTPS scheme.
export function samePublicCompanyRedirect(current,location,company){
 const from=sourceURL(current);
 if(!from||!location||typeof location!=='string')return null;
 try{
  const to=new URL(location,from);
  const normalize=host=>host.toLowerCase().replace(/^www\./,'');
  if(!sourceURL(to.toString())||normalize(to.hostname)!==normalize(from.hostname)||
    !eligiblePublicCompanyPage(to.toString(),company))return null;
  return to.toString();
 }catch{return null}
}

export function eligiblePublicCompanyPage(raw,company){
 const u=sourceURL(raw);
 const tokens=ascii(company).split(' ').filter(t=>t.length>=3);
 if(!u||tokens.length===0)return false;
 const host=ascii(u.hostname.replace(/^www\./,'')).replace(/ /g,'');
 return tokens.some(token=>host.includes(token)) || host.includes(tokens.join(''));
}
export function publishedBusinessMailto({html,sourceUrl,personName,companyName,observedAt}={}){
 const u=sourceURL(sourceUrl),at=Date.parse(observedAt),person=ascii(personName),company=ascii(companyName);
 if(!u||!Number.isFinite(at)||at>Date.now()+300000||person.split(' ').length<2||
   company.length<4||String(html??'').length>160000)return null;
 const page=String(html??'');
 if(!ascii(textOnly(page)).includes(company))return null;
 const emailMatches=[...page.matchAll(/href\s*=\s*["']mailto:([^"'?<>\s]+)(?:\?[^"']*)?["']/gi)].slice(0,30);
 for(const m of emailMatches){
  let address;
  try{address=decodeURIComponent(m[1]).trim().toLowerCase()}catch{continue}
  if(!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(address)||address.length>254)continue;
  const [local,domain]=address.split('@');
  const host=u.hostname.replace(/^www\./,'');
  if(FREE_MAIL.has(domain)||GENERIC.test(local+'@')||!(host===domain||host.endsWith('.'+domain)))continue;
  // Require an EXPLICIT named person near the exact mailto anchor.
  const near=ascii(textOnly(page.slice(Math.max(0,m.index-600),Math.min(page.length,m.index+170))));
  if(!near.includes(person))continue;
  return Object.freeze({
   contract:'POWERHOUSE_PUBLIC_BUSINESS_EMAIL_EVIDENCE_V1',
   classification:'EXPLICIT_PERSON_WORK_MAILTO',
   email:address,source_url:u.toString(),person_name:personName,
   company_name:companyName,observed_at:new Date(at).toISOString(),
   identity_match:'NAME_COMPANY_OFFICIAL_DOMAIN',confidence:0.9,
   format_valid:true,deliverability:'UNVERIFIED',send_authority:'NOT_INFERRED',
   source_publication_date:'UNKNOWN',data_source:'PUBLIC_COMPANY_WEBPAGE',
   privacy:'BUSINESS_CONTACT_ONLY'
  });
 }
 // Some official team cards publish the literal work address as visible
 // text rather than a mailto link. Evidence must be explicitly adjacent to
 // the named person, on the matching public company domain; never infer format.
 const visible=textOnly(page).normalize('NFKD');
 const exactName=String(personName??'').normalize('NFKD').toLowerCase();
 const lower=visible.toLowerCase();
 let pos=-1;
 for(let repeat=0;repeat<8;repeat++){
  pos=lower.indexOf(exactName,pos+1);
  if(pos<0)break;
  const before=pos>0?lower[pos-1]:' ';
  if(/[a-z]/i.test(before))continue;
  const after=visible.slice(pos+exactName.length,pos+exactName.length+105);
  const found=after.match(/^[^@]{0,95}?\b([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})\b/i);
  if(!found)continue;
  const email=found[1].toLowerCase(), [local,domain]=email.split('@');
  const host=u.hostname.replace(/^www\./,'');
  if(FREE_MAIL.has(domain)||GENERIC.test(local+'@')||
    !(host===domain||host.endsWith('.'+domain)))continue;
  return Object.freeze({
   contract:'POWERHOUSE_PUBLIC_BUSINESS_EMAIL_EVIDENCE_V1',
   classification:'EXPLICIT_VISIBLE_PERSON_WORK_EMAIL',
   email,source_url:u.toString(),person_name:personName,
   company_name:companyName,observed_at:new Date(at).toISOString(),
   identity_match:'NAME_COMPANY_OFFICIAL_DOMAIN',confidence:0.78,
   format_valid:true,deliverability:'UNVERIFIED',send_authority:'NOT_INFERRED',
   source_publication_date:'UNKNOWN',data_source:'PUBLIC_COMPANY_WEBPAGE',
   privacy:'BUSINESS_CONTACT_ONLY'
  });
 }
 return null;
}
