import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const config=readFileSync(new URL('netlify.toml',root),'utf8');

function section(header){
  const escaped=header.replace(/[.*+?^$()|[\]\\]/g,'\\$&');
  const found=config.match(new RegExp('^\\['+escaped+'\\]\\r?\\n([\\s\\S]*?)(?=^\\[|$(?![\\s\\S]))','m'));
  assert.ok(found,header+' configuration must exist');
  return found[1];
}

test('No global FFmpeg binary in every serverless and social learning function',()=>{
  const global=section('functions');
  assert.doesNotMatch(global,/^\\s*included_files\\s*=/m);
  assert.doesNotMatch(global,/^\\s*external_node_modules\\s*=/m);
  assert.match(global,/^\\s*node_bundler\\s*=\\s*"esbuild"/m);
});

test('Only the original Mira frame extractor explicitly carries the binary',()=>{
  const frames=section('functions."instagram-video-frames"');
  assert.match(frames,/^\\s*external_node_modules\\s*=\\s*\\["ffmpeg-static"\\]/m);
  assert.match(frames,/^\\s*included_files\\s*=\\s*\\["node_modules\\/ffmpeg-static\\/ffmpeg"\\]/m);
  const original=readFileSync(new URL('netlify/functions/instagram-video-frames.mjs',root),'utf8');
  assert.match(original,/import ffmpegPath from 'ffmpeg-static';/);
});

test('Existing social evaluator scheduler remains owned and unchanged',()=>{
  const evaluator=readFileSync(new URL('netlify/functions/social-learning-evaluate.mjs',root),'utf8');
  assert.match(evaluator,/schedule:\\s*'@hourly'/);
  assert.match(evaluator,/createSocialLearningStore/);
  assert.doesNotMatch(evaluator,/ffmpeg-static/);
});
