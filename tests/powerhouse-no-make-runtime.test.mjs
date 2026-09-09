import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files=[
  '../netlify/functions/_powerhouse-core-client.mjs',
  '../netlify/functions/buffer-social-collect.mjs',
  '../netlify/functions/growth-event.mjs',
  '../netlify/functions/linkedin-revenue-cockpit.mjs',
  '../netlify/functions/powerhouse-content-observer.mjs',
  '../netlify/functions/powerhouse-current-projection.mjs',
  '../netlify/functions/powerhouse-daily-cycle.mjs',
  '../netlify/functions/powerhouse-notion-sync.mjs',
  '../supabase/functions/powerhouse-runtime/index.ts',
];

test('Powerhouse runtime has no Make or legacy alternate learning route',async()=>{
  for(const rel of files){
    const code=await readFile(new URL(rel,import.meta.url),'utf8');
    assert.doesNotMatch(code,/hook\.eu\d+\.make\.com|api\.make\.com|BG16[6789]|legacyFallback|BG_LEGACY_SOCIAL_FALLBACK|_social-learning-store|legacyIngest/i,rel);
  }
});
