import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {canonicalNetlifyBuild,phaseIndex} from './helpers/netlify-canonical-build-source.mjs';
test('all canonical Netlify build phase Node scripts parse before merge',()=>{
  const {phases}=canonicalNetlifyBuild();
  phaseIndex(phases,'pricing-capture','tools/site-shell/pricing-build-integrity.mjs',['capture']);
  phaseIndex(phases,'pricing-restore','tools/site-shell/pricing-build-integrity.mjs',['restore']);
  for(const script of new Set(['tools/ci/netlify-build-entry.mjs',...phases.map(p=>p.script)])){
    execFileSync(process.execPath,['--check',script],{stdio:'pipe'});
  }
});
