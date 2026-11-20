/**
 * MO14 strict Netlify security policy.
 * The deployed PW homepage is an independent legacy app; scope protections to
 * the two owned coach routes so this release cannot silently break that homepage.
 * All inline script bytes must be hashed exactly per build (no unsafe-inline JS).
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export const HTML_ROUTES=[
  ['zaalplanner','/zaalplanner/*'],
  ['veldplanner','/veldplanner/*']
];

export function hashesForInlineScripts(html,route){
 const tokens=[];
 const regex=/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
 for(const match of html.matchAll(regex)){
  const attrs=match[1]||'';
  if(/\bsrc\s*=/.test(attrs)){
   const src=attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
   if(!src||!(src.startsWith('./')||src.startsWith('/'+route+'/')))
    throw new Error('Untrusted script source in '+route);
   continue;
  }
  if(!match[2].trim())continue;
  const hash=createHash('sha256').update(match[2],'utf8').digest('base64');
  tokens.push("'sha256-"+hash+"'");
 }
 if(tokens.length!==1)throw new Error('Expected exactly one explicit inline script in '+route+', got '+tokens.length);
 return tokens;
}
function policy(tokens){
 return [
 "default-src 'none'",
 "script-src 'self' "+tokens.join(' '),
 "script-src-attr 'none'",
 "style-src 'self' 'unsafe-inline'",
 "img-src 'self' data: blob:",
 "font-src 'self' data:",
 "connect-src 'self'",
 "worker-src 'self'",
 "manifest-src 'self'",
 "object-src 'none'",
 "media-src 'none'",
 "frame-src 'none'",
 "frame-ancestors 'none'",
 "base-uri 'none'",
 "form-action 'self'",
 "upgrade-insecure-requests"
 ].join('; ');
}
export function securityHeadersForHtml(routes){
 const blocks=['# Auto-generated. Every script hash is calculated from the exact deployed HTML.'];
 for(const [path,html] of routes){
  const tokens=hashesForInlineScripts(html,path);
  blocks.push('/'+path+'/*');
  blocks.push('  Content-Security-Policy: '+policy(tokens));
  blocks.push('  X-Frame-Options: DENY');
  blocks.push('  X-Content-Type-Options: nosniff');
  blocks.push('  Referrer-Policy: no-referrer');
  blocks.push('  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  blocks.push('  Cross-Origin-Resource-Policy: same-origin');
  blocks.push('  Strict-Transport-Security: max-age=31536000');
  blocks.push('  Cache-Control: no-store, max-age=0');
  blocks.push('');
 }
 return blocks.join('\n')+'\n';
}
export function build(destination){
 const root=resolve(destination);
 const entries=HTML_ROUTES.map(([path])=>[path,readFileSync(join(root,path,'index.html'),'utf8')]);
 const text=securityHeadersForHtml(entries);
 mkdirSync(root,{recursive:true});
 writeFileSync(join(root,'_headers'),text,{encoding:'utf8',mode:0o644});
 return text;
}
if(process.argv[1] && pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 if(!process.argv[2]){console.error('Usage: node build-mo14-headers.mjs <staged-site-root>');process.exit(2);}
 build(process.argv[2]);
 console.log('MO14 strict CSP and security headers generated for both routes');
}
