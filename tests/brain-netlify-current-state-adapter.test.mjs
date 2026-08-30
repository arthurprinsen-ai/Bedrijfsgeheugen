import test from 'node:test';
import assert from 'node:assert/strict';
import { createNetlifyCurrentStateInput } from '../brain/operating-loop/netlify-current-state-adapter.mjs';

test('maps successful Netlify deploy evidence into canonical CurrentState input',()=>{
  const input=createNetlifyCurrentStateInput({
    tenantId:'tenant-a',
    siteId:'site-123',
    deployId:'deploy-456',
    commitRef:'abc123',
    siteName:'bedrijfsgeheugen',
    deployState:'ready',
    publishedAt:'2026-08-30T18:32:41Z',
    deployUrl:'https://example.netlify.app'
  });
  assert.equal(input.source,'netlify');
  assert.equal(input.id,'netlify-current-state:site-123:deploy-456');
  assert.equal(input.component,'netlify:site-123:bedrijfsgeheugen');
  assert.equal(input.raw.site_id,'site-123');
  assert.equal(input.raw.deploy_id,'deploy-456');
  assert.equal(input.raw.commit_ref,'abc123');
  assert.equal(input.raw.published_at,'2026-08-30T18:32:41Z');
  assert.equal(input.health,'healthy');
  assert.equal(input.capacity,'available');
  assert.equal(input.executionStatus,'completed');
  assert.equal(input.revision,'abc123');
  assert.equal(input.verified,true);
});

test('maps failed and cancelled deploy states deterministically',()=>{
  const base={tenantId:'tenant-a',siteId:'site-1',deployId:'dep-1',commitRef:'sha-1',siteName:'site',publishedAt:'2026-08-30T18:32:41Z'};
  const failed=createNetlifyCurrentStateInput({...base,deployState:'error'});
  assert.equal(failed.health,'unhealthy');
  assert.equal(failed.executionStatus,'failed');
  assert.equal(failed.error,'NETLIFY_DEPLOY_ERROR');
  const cancelled=createNetlifyCurrentStateInput({...base,deployId:'dep-2',deployState:'canceled'});
  assert.equal(cancelled.health,'degraded');
  assert.equal(cancelled.executionStatus,'interrupted');
  assert.equal(cancelled.capacity,'interrupted');
});

test('fails closed without registered Netlify provenance fields',()=>{
  assert.throws(()=>createNetlifyCurrentStateInput({tenantId:'tenant-a'}),/siteId/);
  assert.throws(()=>createNetlifyCurrentStateInput({tenantId:'tenant-a',siteId:'site'}),/deployId/);
  assert.throws(()=>createNetlifyCurrentStateInput({tenantId:'tenant-a',siteId:'site',deployId:'dep'}),/commitRef/);
  assert.throws(()=>createNetlifyCurrentStateInput({tenantId:'tenant-a',siteId:'site',deployId:'dep',commitRef:'sha',siteName:'site'}),/publishedAt/);
});
