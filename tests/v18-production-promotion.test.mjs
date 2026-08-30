import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

assert.ok(existsSync('tools/bouw-v18-production.mjs'), 'production V18 wrapper must exist');
assert.ok(existsSync('tools/bouw-v18-production-core.mjs'), 'production V18 core must exist');
const wrapper = readFileSync('tools/bouw-v18-production.mjs','utf8');
const builder = readFileSync('tools/bouw-v18-production-core.mjs','utf8');

assert.match(wrapper, /bouw-v18-production-core\.mjs/, 'wrapper must execute the pinned V18 production core');
assert.doesNotMatch(wrapper, /apply-site-baseline\.mjs/, 'legacy V18 restore must not apply a later site-baseline overlay');

assert.match(builder, /v18-full\/chunk-00\.txt/, 'builder core must use pinned V18 payload');
assert.match(builder, /be938e95870994b89773d141a400318a1be3eac4829d69aac6bac48942bd230b/, 'builder must pin the accepted historical V18 HTML hash');
assert.match(builder, /13761469-uhd_3840_2160_30fps\.mp4/, 'legacy production must restore the historical V18 hero source');
assert.match(builder, /writeFile\('index\.html'/, 'builder core must materialize the legacy homepage as index.html');
assert.match(builder, /prototype-v18-stable\.html/, 'builder core must retain a stable comparison copy');
assert.doesNotMatch(builder, /bgMobileNav|v18-mobile-drilldown|__BG_PRODUCTION_VERSION__|V18\.8/, 'legacy V18 restore must not inject later V18.8 navigation or markers');

const netlify = readFileSync('netlify.toml','utf8');
assert.match(netlify, /node tools\/bouw-v18-production\.mjs/, 'Netlify build must run the V18 production wrapper');

console.log('Legacy V18 production restore contract passed');
