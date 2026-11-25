import test from 'node:test';
import assert from 'node:assert/strict';
import {parseNativeVideoDimensions,checkNativeMiraReelDimensions} from '../netlify/functions/_instagram-native-reel-probe.mjs';
import {planMiraPreventiveRecovery} from '../supabase/functions/_shared/mira-preventive-quality-recovery.mjs';
import {eligibleSourceLedMediaReplacement} from '../supabase/functions/_shared/mira-frozen-winner-contract.mjs';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const raw=(width,height)=>`Input #0, mov,mp4,m4a,3gp,3g2,mj2, from '/tmp/source.mp4':
  Duration: 00:00:08.04, start: 0.000000, bitrate: 1293 kb/s
  Stream #0:0(und): Video: h264 (Main), yuv420p(tv, bt709), ${width}x${height} [SAR 1:1 DAR 9:16], 24 fps
  Stream #0:1(und): Audio: aac, 44100 Hz`;

test('measures native portrait from ffmpeg video stream not aspect assertion',()=>{
 const ok=checkNativeMiraReelDimensions(parseNativeVideoDimensions(raw(1080,1920)));
 assert.equal(ok.ok,true);
 assert.equal(ok.width,1080);
 assert.equal(ok.height,1920);
 assert.equal(ok.contract,'mira-exact-native-mp4-before-vision-v1');
});
test('rejects actual observed Kling 1292x1604 despite letterboxed JPEG being 1080x1920',()=>{
 const m=parseNativeVideoDimensions(raw(1292,1604));
 assert.deepEqual({width:m.width,height:m.height}, {width:1292,height:1604});
 const fail=checkNativeMiraReelDimensions(m);
 assert.equal(fail.ok,false);
 assert.equal(fail.error,'MIRA_NATIVE_VIDEO_DIMENSIONS_MISMATCH');
 assert.equal(fail.required_height,1920);
});
test('unknown MP4 metadata cannot turn into compliant dimensions',()=>{
 assert.equal(checkNativeMiraReelDimensions(parseNativeVideoDimensions('')).ok,false);
 assert.equal(checkNativeMiraReelDimensions({ok:false,width:1080,height:1920}).ok,false);
 assert.equal(checkNativeMiraReelDimensions({ok:true,width:1920,height:1080}).ok,false);
});
test('Netlify original MP4 is verified before images are padded; router never trusts supplied frames',()=>{
 const extractor=read('netlify/functions/instagram-video-frames.mjs');
 const router=read('supabase/functions/powerhouse-instagram-media-router/index.ts');
 const sample=extractor.indexOf('const points=instagramFrameSamplePoints(duration)');
 const probe=extractor.indexOf('const actual=checkNativeMiraReelDimensions(');
 assert.ok(probe>0&&probe<sample);
 assert.match(extractor,/native_dimensions_verified:true,native_width:actual.width,native_height:actual.height/);
 assert.match(router,/const frames=fb.frames/);
 assert.doesNotMatch(router,/let frames=Array.isArray\(manifest.frames\)/);
 const proof=router.indexOf('native_dimensions_verified!==true');
 const expensive=router.indexOf("powerhouse-instagram-media-verifier',payload");
 assert.ok(proof>0&&proof<expensive);
 assert.match(router,/recordMediaProofRejection\(db,\{[\s\S]*code:'MIRA_NATIVE_VIDEO_DIMENSIONS_MISMATCH'/);
});
test('native format reject is independently diagnosable without turning into vision score or PASS',()=>{
 const preflight=read('supabase/functions/powerhouse-instagram-media-router/preflight-write.mjs');
 assert.match(preflight,/MIRA_NATIVE_VIDEO_DIMENSIONS_MISMATCH:'\+measuredWidth\+'x'\+measuredHeight/);
 assert.match(preflight,/native_video_width:measuredWidth,native_video_height:measuredHeight/);
 assert.match(preflight,/brain_observe_failure/);
});
test('same owner receives pre-generation instructions after true native format failure',()=>{
 const original='qAUQW2ZzqdasS0ePb1PD';
 const id='0a56f150-2954-4355-a3d0-fc65396f8152';
 const resolved={kind:'approved_source_led',winner_recommendation_id:id,scene:'Original frozen parking-app scene',openart_history_id:original};
 const job={status:'WAITING_PROOF',asset_manifest:{openart_history_id:original,openart_project_id:'rUF5anXD47gVokckYjf9',recommendation_id:id,openart_reference_id:'Yjqu4D7v76HABNPmQPj1'},last_error:'MIRA_NATIVE_VIDEO_DIMENSIONS_MISMATCH:1292x1604:openart=K3NqiqlKMGWDM3UEJGu0'};
 const ob={status:'BLOCKED',external_id:null,live_proven_at:null,evidence:{}};
 const x=planMiraPreventiveRecovery({runDate:'2026-10-25',resolved,job,ob});
 assert.equal(x.eligible,true);
 assert.equal(x.failure_class,'NATIVE_VIDEO_FORMAT_INVALID');
 assert.equal(x.observed_native_width,1292);
 assert.equal(x.observed_native_height,1604);
 assert.equal(x.observed_confidence,null);
 assert.match(x.producer_instructions,/actual 9:16 full-bleed 1080x1920/);
 assert.equal(x.meta_create_allowed_before_exact_media_pass,false);
 assert.equal(x.bounded_new_generations_per_decision,1);
 assert.equal(planMiraPreventiveRecovery({runDate:'2026-10-25',resolved,job,ob:{...ob,external_id:'already-live'}}).eligible,false);
 assert.equal(planMiraPreventiveRecovery({runDate:'2026-10-25',resolved,job:{...job,last_error:'MIRA_NATIVE_VIDEO_DIMENSIONS_UNVERIFIED'},ob}).eligible,false);
});
test('still retains real face and temporal thresholds and never changes producer sender',()=>{
 const router=read('supabase/functions/powerhouse-instagram-media-router/index.ts');
 const canonical=read('supabase/functions/_shared/mira-canonical-face.mjs');
 const temporal=read('supabase/functions/powerhouse-instagram-temporal-verifier/index.ts');
 assert.match(canonical,/MIRA_IDENTITY_MIN_CONFIDENCE=0.94/);
 assert.match(temporal,/Number\(v.confidence\)>=0.9/);
 assert.match(router,/powerhouse-instagram-temporal-verifier/);
 assert.match(router,/MIRA_NATIVE_VIDEO_DIMENSIONS_MISMATCH/);
});
