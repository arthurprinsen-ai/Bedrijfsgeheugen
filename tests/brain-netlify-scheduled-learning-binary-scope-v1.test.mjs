import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const config=readFileSync(new URL('netlify.toml',root),'utf8');

function section(header){
  const anchor='['+header+']';
  const start=config.indexOf(anchor+'\n');
  assert.ok(start>=0,header+' configuration must exist');
  const after=config.slice(start+anchor.length+1);
  const next=after.search(/\r?\n\[/);
  return next>=0?after.slice(0,next):after;
}

test('No globally included FFmpeg for all scheduled Netlify functions',()=>{
  const global=section('functions');
  assert.doesNotMatch(global,/^\s*included_files\s*=/m);
  assert.doesNotMatch(global,/^\s*external_node_modules\s*=/m);
  assert.match(global,/^\s*node_bundler\s*=\s*"esbuild"/m);
});

test('Original Mira frame extractor alone explicitly includes ffmpeg-static',()=>{
  const frames=section('functions."instagram-video-frames"');
  assert.match(frames,/^\s*external_node_modules\s*=\s*\["ffmpeg-static"\]/m);
  assert.match(frames,/^\s*included_files\s*=\s*\["node_modules\/ffmpeg-static\/ffmpeg"\]/m);
  const source=readFileSync(new URL('netlify/functions/instagram-video-frames.mjs',root),'utf8');
  assert.match(source,/import ffmpegPath from 'ffmpeg-static';/);
});

test('Canonical learning scheduler and Supabase store are unchanged',()=>{
  const evaluator=readFileSync(new URL('netlify/functions/social-learning-evaluate.mjs',root),'utf8');
  assert.match(evaluator,/schedule:\s*'@hourly'/);
  assert.match(evaluator,/createSocialLearningStore/);
  assert.doesNotMatch(evaluator,/ffmpeg-static/);
  const revenueEvaluator=readFileSync(new URL('netlify/functions/revenue-learning-evaluate.mjs',root),'utf8');
  assert.match(revenueEvaluator,/schedule:\s*'@hourly'/);
  assert.doesNotMatch(revenueEvaluator,/ffmpeg-static/);
});

test('A netlify.toml-only change cannot be skipped by the deployment applicability guard',async()=>{
  const {deriveNetlifyDeploymentApplicability}=await import('../tools/delivery/netlify-deployment-applicability.mjs');
  const policy=JSON.parse(readFileSync(new URL('config/brain-delivery-system.json',root),'utf8'));
  const status=deriveNetlifyDeploymentApplicability({
    changedPaths:['netlify.toml'],
    headSha:'a'.repeat(40),
    policy,
  });
  assert.equal(status.netlifyRuntimeRequired,true);
  assert.equal(status.deploymentRequired,true);
  assert.ok(status.runtimeChangedPaths.includes('netlify.toml'));
});

test('Deploy previews cannot skip the required independent function bundle check',()=>{
  const preview=section('context.deploy-preview');
  assert.match(preview,/^\s*ignore\s*=\s*"exit 1"/m);
  const production=section('build');
  assert.match(production,/^\s*ignore\s*=\s*"node \.\/tools\/ci\/netlify-ignore-build\.mjs"/m);
});
