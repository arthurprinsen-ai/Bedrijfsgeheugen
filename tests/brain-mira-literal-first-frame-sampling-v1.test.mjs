import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {instagramFrameSamplePoints} from '../netlify/functions/_instagram-frame-sampling.mjs';

test('literal first decoded video frame is t=0, not t=0.25s',()=>{
 assert.deepEqual(instagramFrameSamplePoints(8),[
   ['start',0],['middle',4],['end',7.75]
 ]);
 assert.deepEqual(instagramFrameSamplePoints(5),[
   ['start',0],['middle',2.5],['end',4.75]
 ]);
});

test('duration is bounded before external media extraction',()=>{
 for(const duration of [undefined,null,NaN,Infinity,-1,0,61,'abc']){
   assert.throws(()=>instagramFrameSamplePoints(duration),/INVALID_VIDEO_DURATION/);
 }
});

test('existing extractor retains auth, OpenArt-only input and verifiable frame proof',()=>{
 const source=readFileSync('netlify/functions/instagram-video-frames.mjs','utf8');
 assert.match(source,/import \{instagramFrameSamplePoints\} from '\.\/_instagram-frame-sampling\.mjs';/);
 assert.match(source,/const points=instagramFrameSamplePoints\(duration\)/);
 assert.match(source,/'-ss',String\(seconds\),'-i',input/);
 assert.match(source,/if\(!\(await tokenIsValid\(token\)\)\)/);
 assert.match(source,/safeOpenArtUrl\(mediaUrl\)/);
 assert.match(source,/for\(const \[position,seconds\] of points\)/);
 assert.match(source,/imageBase64:frame\.toString\('base64'\)/);
});
