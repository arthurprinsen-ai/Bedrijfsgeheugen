import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { repairCustomerPortalAuth } from './customer-portal-auth-race.mjs';
import { transformIdentityTokenFlow } from './fix-netlify-identity-token-flow.mjs';

const identitySource = await readFile('node_modules/@netlify/identity/dist/main.js', 'utf8');
const goTrueSource = await readFile('node_modules/gotrue-js/lib/index.js', 'utf8');
const importStatement = 'import GoTrue from "gotrue-js";';

if (!identitySource.includes(importStatement)) {
  throw new Error('Unsupported @netlify/identity browser bundle: GoTrue import not found');
}

const customerPortalSource = await readFile('klantportaal.html', 'utf8');
const guardedCustomerPortal = transformIdentityTokenFlow(repairCustomerPortalAuth(customerPortalSource));

await mkdir('assets/vendor', { recursive: true });
await Promise.all([
  writeFile('assets/vendor/netlify-identity.mjs', identitySource.replace(importStatement, 'import GoTrue from "./gotrue.mjs";')),
  writeFile('assets/vendor/gotrue.mjs', goTrueSource),
  writeFile('klantportaal.html', guardedCustomerPortal),
]);

console.log('Powerhouse Identity browser modules built from pinned npm dependencies');
console.log('Customer portal auth race guard applied');
console.log('Netlify Identity recovery/invite token guard applied');
