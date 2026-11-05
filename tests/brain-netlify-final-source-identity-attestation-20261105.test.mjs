import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveFinalReleaseIdentity } from '../tools/site-shell/release-source-identity.mjs';

const PUBLISHED='9f8e4367e52fb9d8f737f82fbc83fa807b1bd3f6';
const SYNTHETIC='14fbc8ede60b0fcda6bbd156064426a632f62032';
const other='a1b6fcae4103e0d74cd25f288da1c75ca5535cad';
const evidence=sha=>({commit_ref:sha,context:'production',deploy_id:'netlify-test-immutable'});
const call=overrides=>resolveFinalReleaseIdentity({
  env:{CONTEXT:'production'},markerText:'',existingRelease:evidence(PUBLISHED),
  gitHead:PUBLISHED,gitOrigin:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen.git',
  gitRemoteMain:PUBLISHED,...overrides,
});

test('API source marker wins over unrelated ephemeral build Git HEAD',()=>{
  assert.equal(call({markerText:PUBLISHED,gitHead:SYNTHETIC,gitOrigin:''}),PUBLISHED);
});

test('native provider COMMIT_REF is source authority and matches earlier release evidence',()=>{
  assert.equal(call({env:{COMMIT_REF:PUBLISHED},gitHead:PUBLISHED,gitOrigin:''}),PUBLISHED);
});

test('never overwrite prior release identity with different provider SHA',()=>{
  assert.throws(()=>call({env:{COMMIT_REF:SYNTHETIC}}),/PRODUCTION_RELEASE_EVIDENCE_SOURCE_MISMATCH/);
});

test('HEAD-only fallback rejects unverified transient 40-hex Git commit',()=>{
  assert.throws(()=>call({env:{HEAD:SYNTHETIC},markerText:'',gitHead:SYNTHETIC,gitOrigin:'',gitRemoteMain:''}),/PRODUCTION_RELEASE_EVIDENCE_SOURCE_MISMATCH|PRODUCTION_RELEASE_UNATTESTED_HEAD_FALLBACK/);
  assert.throws(()=>call({env:{HEAD:PUBLISHED},markerText:'',gitHead:PUBLISHED,gitOrigin:'',gitRemoteMain:PUBLISHED}),/PRODUCTION_RELEASE_UNATTESTED_HEAD_FALLBACK/);
  assert.throws(()=>call({env:{HEAD:PUBLISHED},markerText:'',gitHead:PUBLISHED,gitOrigin:'https://github.com/another-org/another-repo.git',gitRemoteMain:PUBLISHED}),/PRODUCTION_RELEASE_UNATTESTED_HEAD_FALLBACK/);
});

test('verified native Git checkout can still provide HEAD when Netlify omits COMMIT_REF',()=>{
  assert.equal(call({env:{HEAD:PUBLISHED},gitHead:PUBLISHED,gitRemoteMain:PUBLISHED}),PUBLISHED);
  assert.equal(call({env:{HEAD:PUBLISHED},gitHead:PUBLISHED,gitOrigin:'git@github.com:arthurprinsen-ai/Bedrijfsgeheugen.git',gitRemoteMain:PUBLISHED}),PUBLISHED);
});

test('verified Git origin alone cannot certify a different or missing remote main',()=>{
  for(const gitRemoteMain of ['',other]){
    assert.throws(()=>call({env:{HEAD:PUBLISHED},gitHead:PUBLISHED,gitRemoteMain}),/PRODUCTION_RELEASE_UNATTESTED_HEAD_FALLBACK/);
  }
  assert.throws(()=>call({env:{HEAD:PUBLISHED},gitHead:SYNTHETIC,gitRemoteMain:PUBLISHED}),/PRODUCTION_RELEASE_UNATTESTED_HEAD_FALLBACK/);
});

test('reject invalid or contradictory source marker and earlier stamped evidence',()=>{
  assert.throws(()=>call({markerText:'bad-sha'}),/PRODUCTION_RELEASE_MARKER_INVALID/);
  assert.throws(()=>call({markerText:PUBLISHED,env:{COMMIT_REF:other}}),/RELEASE_SOURCE_IDENTITY_MISMATCH/);
  assert.throws(()=>call({markerText:PUBLISHED,existingRelease:evidence(SYNTHETIC)}),/PRODUCTION_RELEASE_EVIDENCE_SOURCE_MISMATCH/);
  assert.throws(()=>call({env:{COMMIT_REF:'broken'}}),/PRODUCTION_RELEASE_COMMIT_REF_INVALID/);
});

test('original production builder must preserve attested pre-final source identity',()=>{
  const build=readFileSync('tools/ci/netlify-build-entry.mjs','utf8');
  assert.match(build,/resolveFinalReleaseIdentity/);
  assert.match(build,/readFile\('release.json','utf8'\)/);
  assert.match(build,/readFile\('\.bg-source-commit','utf8'\)/);
  assert.match(build,/git',\['remote','get-url','origin'\]/);
  assert.match(build,/git',\['rev-parse','--verify','refs\/remotes\/origin\/main'\]/);
  assert.match(build,/await restampReleaseIdentity\(\{root:process\.cwd\(\),commitRef,context,deployId\}\)/);
  assert.match(build,/if\(context==='production'\)/);
});
