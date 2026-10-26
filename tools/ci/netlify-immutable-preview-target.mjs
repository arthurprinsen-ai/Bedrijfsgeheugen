import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

// Provider status target_url is a NETLIFY DASHBOARD page, not a deploy URL.
// Only exact provider-origin deploy IDs may be converted to immutable URLs.
// Never curl target_url + '/release.json' or trust a third-party status link.
export function immutableNetlifyPreviewUrl(target,{site='bedrijfsgeheugen'}={}){
 if(typeof target!=='string'||!target.trim())throw new TypeError('NETLIFY_PREVIEW_TARGET_MISSING');
 if(!/^[a-z0-9-]+$/.test(site))throw new TypeError('NETLIFY_SITE_SLUG_INVALID');
 let url;
 try{url=new URL(target);}catch{throw new TypeError('NETLIFY_PREVIEW_TARGET_INVALID')}
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.port)
   throw new TypeError('NETLIFY_PREVIEW_TARGET_INVALID');
 const path=new RegExp('^/projects/'+site+'/deploys/([a-f0-9]{24})/?$');
 const match=url.hostname==='app.netlify.com'?url.pathname.match(path):null;
 const immutableHost=new RegExp('^([a-f0-9]{24})--'+site+'\\.netlify\\.app$');
 const direct=url.pathname==='/'||url.pathname===''?url.hostname.match(immutableHost):null;
 const deployId=match?.[1]||direct?.[1];
 if(!deployId)throw new TypeError('NETLIFY_PREVIEW_TARGET_UNTRUSTED');
 return 'https://'+deployId+'--'+site+'.netlify.app';
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 try{
   process.stdout.write(immutableNetlifyPreviewUrl(process.argv[2]||'')+'\n');
 }catch(error){
   process.stderr.write((error instanceof Error?error.message:String(error))+'\n');
   process.exitCode=1;
 }
}
