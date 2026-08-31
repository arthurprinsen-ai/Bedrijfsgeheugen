import { readFile, writeFile } from 'node:fs/promises';
import { injectPortalRuntimeHook } from './portal-runtime-hook.mjs';

const commitRef = String(process.env.COMMIT_REF || process.env.HEAD || '').trim();
if (!/^[a-f0-9]{40}$/i.test(commitRef)) {
  throw new Error('Netlify COMMIT_REF/HEAD is required for exact production evidence');
}
const evidence = {
  contract: 'BRAIN-DELIVERY-v2',
  production_authority: 'BG169',
  commit_ref: commitRef,
  context: String(process.env.CONTEXT || ''),
  deploy_id: String(process.env.DEPLOY_ID || ''),
  generated_at: new Date().toISOString(),
};
await writeFile('release.json', `${JSON.stringify(evidence, null, 2)}\n`);

const portalPath='klantportaal.html';
const portal=await readFile(portalPath,'utf8');
const portalWithRuntime=injectPortalRuntimeHook(portal);
if(portalWithRuntime!==portal) await writeFile(portalPath,portalWithRuntime,'utf8');

console.log('RELEASE_EVIDENCE', commitRef);
console.log('PORTAL_RUNTIME_HOOK', portalWithRuntime.includes('id="bg-portal-runtime"')?'present':'missing');
