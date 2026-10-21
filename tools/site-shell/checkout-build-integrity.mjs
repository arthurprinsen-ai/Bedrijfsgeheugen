import {mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const SOURCE='afsluiten.html';
const SNAPSHOT='.bg-build/checkout-source.html';
export function assertCheckoutContract(html,label='checkout'){
 for(const id of ['checkoutResultTitle','checkoutResultText','checkoutContinue','sources','freshness','automation','status','plan','billingCycle','form']){
  const matches=[...html.matchAll(new RegExp('\\bid=["\']'+id+'["\']','g'))];
  if(matches.length!==1)throw Error(`CHECKOUT_TARGET_INVALID:${label}:${id}:${matches.length}`);
 }
 for(const token of ['data-bg-page-runtime="saas-checkout"','/api/checkout/readiness?session_id=','/api/checkout/create','data.ready===true','bg_checkout_attempt_v1']){
  if(!html.includes(token))throw Error(`CHECKOUT_RUNTIME_MISSING:${label}:${token}`);
 }
 if(!/<h2\b[^>]*id=["']checkoutResultTitle["']/.test(html))throw Error(`CHECKOUT_DYNAMIC_HEADING_MOVED:${label}`);
 if(!/#checkout\[hidden\]\s*\{\s*display\s*:\s*none\s*!important\s*;?\s*\}/.test(html))throw Error(`CHECKOUT_HIDDEN_GRID_UNGUARDED:${label}`);
 return true;
}
export async function checkoutBuildIntegrity(mode){
 if(mode==='capture'){
  const source=await readFile(SOURCE,'utf8');assertCheckoutContract(source,'source');
  await mkdir('.bg-build',{recursive:true});await writeFile(SNAPSHOT,source,'utf8');
 }else if(mode==='restore'){
  const source=await readFile(SNAPSHOT,'utf8');assertCheckoutContract(source,'snapshot');
  await writeFile(SOURCE,source,'utf8');await rm(SNAPSHOT,{force:true});
 }else if(mode==='verify'){
  for(const file of [SOURCE,'en/afsluiten.html'])assertCheckoutContract(await readFile(file,'utf8'),file);
 }else throw Error('Usage: checkout-build-integrity.mjs capture|restore|verify');
 console.log(`CHECKOUT_BUILD_INTEGRITY ${mode}`);
}
if(process.argv[1]===fileURLToPath(import.meta.url))await checkoutBuildIntegrity(process.argv[2]);
