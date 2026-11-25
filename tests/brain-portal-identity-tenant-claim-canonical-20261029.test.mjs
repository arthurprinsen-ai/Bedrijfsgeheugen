import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Canonical historical/shadow/canary gate executes the full existing portal
// production-proof tests, including the provider-admin repair and fail-closed
// JWT, two-tenant, and synthetic-user cleanup assertions.
import './portal-authenticated-production-proof.test.mjs';

test('canonical Identity tenant proof keeps server metadata readback and strict JWT controls',()=>{
  const source=readFileSync('platform/api/portal-authenticated-production-proof-core.mjs','utf8');
  assert.match(source,/identityAdmin\.getUser\(user\.id\)/);
  assert.match(source,/identityAdmin\.updateUser\(user\.id,/);
  assert.match(source,/IDENTITY_ADMIN_TENANT_METADATA_NOT_PERSISTED/);
  assert.match(source,/claims\?\.app_metadata\?\.tenantId/);
  assert.match(source,/AUTHENTICATED_TENANT_SCOPE_MISMATCH/);
  assert.match(source,/identityAdmin\.deleteUser\(id\)/);
});
