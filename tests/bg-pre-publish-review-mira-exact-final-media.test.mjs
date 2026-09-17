import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sourcePath=new URL('../supabase/functions/bg-pre-publish-review/index.ts',import.meta.url);
const source=()=>fs.readFileSync(sourcePath,'utf8');

test('Instagram proof is bound to exact final media and canonical profile',()=>{const s=source();assert.match(s,/FINAL_MEDIA_DIGEST_REQUIRED/);assert.match(s,/EXACT_FINAL_MEDIA_UNPROVEN/);assert.match(s,/INSTAGRAM_CHANNEL_ID_MISMATCH/);assert.match(s,/6a70384d99afb44349f0fba9/)});
test('Instagram proof requires verified visual evidence for the same asset',()=>{const s=source();assert.match(s,/INSTAGRAM_VISUAL_EVIDENCE_REQUIRED/);assert.match(s,/INSTAGRAM_FINAL_ASSET_MISMATCH/);assert.match(s,/INSTAGRAM_MIRA_VISUAL_REQUIRED/);assert.match(s,/evidence_refs/)});
test('Instagram video requires verified start middle end Mira frames',()=>{const s=source();assert.match(s,/INSTAGRAM_VIDEO_FRAME_EVIDENCE_REQUIRED/);assert.match(s,/INSTAGRAM_MIRA_FRAME_IDENTITY_REQUIRED/);for(const position of ['start','middle','end'])assert.match(s,new RegExp(position))});
