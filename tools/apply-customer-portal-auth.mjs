import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { repairCustomerPortalAuth } from './customer-portal-auth-race.mjs';

export function applyCustomerPortalAuth(portalUrl = new URL('../klantportaal.html', import.meta.url)) {
  const portalPath = fileURLToPath(portalUrl);
  const source = readFileSync(portalPath, 'utf8');
  const repaired = repairCustomerPortalAuth(source);

  if (repaired !== source) {
    writeFileSync(portalPath, repaired, 'utf8');
    return 'Customer portal persistent auth applied.';
  }

  return 'Customer portal persistent auth already applied.';
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(applyCustomerPortalAuth());
}
