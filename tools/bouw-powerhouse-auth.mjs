import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { repairCustomerPortalAuth } from './customer-portal-auth-race.mjs';
import { transformIdentityTokenFlow } from './fix-netlify-identity-token-flow.mjs';

const customerPortalSource = await readFile('klantportaal.html', 'utf8');
const guardedCustomerPortal = transformIdentityTokenFlow(repairCustomerPortalAuth(customerPortalSource));
await writeFile('klantportaal.html', guardedCustomerPortal);

const identityPath = 'node_modules/@netlify/identity/dist/main.js';
const goTruePath = 'node_modules/gotrue-js/lib/index.js';
const importStatement = 'import GoTrue from "gotrue-js";';

async function exists(path) {
  try { await access(path, constants.R_OK); return true; }
  catch { return false; }
}

if (await exists(identityPath) && await exists(goTruePath)) {
  const identitySource = await readFile(identityPath, 'utf8');
  const goTrueSource = await readFile(goTruePath, 'utf8');
  if (!identitySource.includes(importStatement)) throw new Error('Unsupported legacy @netlify/identity browser bundle: GoTrue import not found');
  await mkdir('assets/vendor', { recursive: true });
  await Promise.all([
    writeFile('assets/vendor/netlify-identity.mjs', identitySource.replace(importStatement, 'import GoTrue from "./gotrue.mjs";')),
    writeFile('assets/vendor/gotrue.mjs', goTrueSource),
  ]);
  console.log('Legacy Powerhouse Identity browser modules built from pinned npm dependencies');
} else {
  console.log('Legacy @netlify/identity browser bundle absent; skipping obsolete vendoring');
}
console.log('Customer portal auth race guard applied');
console.log('Netlify Identity recovery/invite token guard applied');
