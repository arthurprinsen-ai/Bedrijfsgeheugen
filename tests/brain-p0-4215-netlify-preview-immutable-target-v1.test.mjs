import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {immutableNetlifyPreviewUrl} from '../tools/ci/netlify-immutable-preview-target.mjs';

const id='6ac8a971adf7f400087df6e8';
const immutable='https://'+id+'--bedrijfsgeheugen.netlify.app';

test('actual Netlify GitHub status URL is converted to immutable release origin, never dashboard URL + release.json',()=>{
 const status='https://app.netlify.com/projects/bedrijfsgeheugen/deploys/'+id;
 assert.equal(immutableNetlifyPreviewUrl(status),immutable);
 assert.equal(immutableNetlifyPreviewUrl(status+'/'),immutable);
 assert.equal(immutableNetlifyPreviewUrl(immutable),immutable);
});
test('untrusted or ambiguous status URLs are rejected before any preview request',()=>{
 for(const invalid of [
  'https://app.netlify.com.evil.test/projects/bedrijfsgeheugen/deploys/'+id,
  'http://app.netlify.com/projects/bedrijfsgeheugen/deploys/'+id,
  'https://foo:password@app.netlify.com/projects/bedrijfsgeheugen/deploys/'+id,
  'https://app.netlify.com/projects/another/deploys/'+id,
  'https://app.netlify.com/projects/bedrijfsgeheugen/deploys/'+id+'?redirect=1',
  'https://app.netlify.com/projects/bedrijfsgeheugen/deploys/invalid',
  'https://deploy-preview-4236--bedrijfsgeheugen.netlify.app',
  'https://'+id+'--other.netlify.app',
  'https://'+id+'--bedrijfsgeheugen.netlify.app/evil',
  'javascript:alert(1)',
  ''
 ])assert.throws(()=>immutableNetlifyPreviewUrl(invalid),/NETLIFY_PREVIEW_TARGET_/);
});
test('Portal V2 preview workflow fail-closes until immutable deploy id and SHA both match',()=>{
 const workflow=readFileSync(new URL('../.github/workflows/portal-v2-live-preview.yml',import.meta.url),'utf8');
 assert.match(workflow,/netlify-immutable-preview-target\.mjs "\$target"/);
 assert.doesNotMatch(workflow,/\$target\/release\.json/);
 assert.match(workflow,/\$deployed_sha" = "\$HEAD_SHA"/);
 assert.match(workflow,/\$immutable" = "https:\/\/\$\{deploy_id\}--bedrijfsgeheugen\.netlify\.app"/);
 assert.match(workflow,/if \[ "\$state" = "failure" \] \|\| \[ "\$state" = "error" \]/);
 assert.match(workflow,/if-no-files-found: error/);
});
