import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

assert.ok(existsSync('tools/bouw-v18-production.mjs'), 'production V18 wrapper must exist');
assert.ok(existsSync('tools/bouw-v18-production-core.mjs'), 'production V18 core must exist');
const wrapper = readFileSync('tools/bouw-v18-production.mjs','utf8');
const builder = readFileSync('tools/bouw-v18-production-core.mjs','utf8');
assert.match(wrapper, /bouw-v18-production-core\.mjs/, 'wrapper must execute proven V18 core');
assert.match(wrapper, /apply-site-baseline\.mjs/, 'wrapper must apply accepted site baseline after V18 core');
assert.match(builder, /v18-full\/chunk-00\.txt/, 'builder core must use pinned V18 payload');
assert.match(builder, /openart-hero-iphone-safe-v1\.mp4/, 'builder core must use accepted local iPhone-safe hero media');
assert.doesNotMatch(builder, /cdn\.openart\.ai|fetch\(OPENART_SOURCE|ffmpeg-static/, 'production build must not depend on external hero download/transcoding');
assert.match(builder, /writeFile\('index\.html'/, 'builder core must materialize the production homepage as index.html');
assert.match(builder, /prototype-v18-stable\.html/, 'builder core must retain a stable comparison copy');

const netlify = readFileSync('netlify.toml','utf8');
assert.match(netlify, /node tools\/bouw-v18-production\.mjs/, 'Netlify build must run the V18 production wrapper');

console.log('V18 production promotion contract passed');
