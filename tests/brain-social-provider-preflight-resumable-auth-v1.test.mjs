import assert from 'node:assert/strict';
import fs from 'node:fs';

const publisher = fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const router = fs.readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
// The temporal (continuous-take) judgement lives in the dedicated verifier; the router enforces its verdict.
const temporal = fs.readFileSync('supabase/functions/powerhouse-instagram-temporal-verifier/index.ts','utf8');

const preflight = publisher.indexOf("await preflightLinkedInViaComposio(db)");
const claim = publisher.indexOf("// Single-writer idempotency barrier");
assert.ok(preflight >= 0, 'LinkedIn provider preflight must exist');
assert.ok(claim >= 0 && preflight < claim, 'LinkedIn auth preflight must run before the publication claim');
assert.match(publisher,/provider_auth_resumable:true/);
assert.match(publisher,/state:'content_ready'/);
assert.match(publisher,/REVOKED_ACCESS_TOKEN/);

assert.match(router,/MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED/);
assert.match(router,/mira-continuous-human-video-v1/);
assert.match(temporal,/single_continuous_take===true/);
assert.match(temporal,/identity_continuity_verified===true/);
assert.match(temporal,/still_image_animation_detected===false/);

console.log('social provider preflight and Instagram temporal proof contracts are present');
