import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifierProbeAuthorizesToken as verify} from '../netlify/functions/_instagram-frame-auth-contract.mjs';
test('only exact authorized canonical empty-input response grants access',()=>{
 assert.equal(verify(400,{ok:false,error:'INVALID_INPUT'}),true);
 for(const code of [200,201,301,302,400,401,403,404,408,422,429,500,502,503,504]){
  if(code!==400)assert.equal(verify(code,{ok:false,error:'INVALID_INPUT'}),false,String(code));
 }
 for(const body of [null,undefined,[],true,'INVALID_INPUT',{}, {error:'INVALID_INPUT'},{ok:true,error:'INVALID_INPUT'},{ok:false,error:'UNAUTHORIZED'},{ok:false,error:'CONFIG'}])
  assert.equal(verify(400,body),false,JSON.stringify(body));
});
test('original frame endpoint denies failures and demands canonical proof',()=>{
 const s=readFileSync('netlify/functions/instagram-video-frames.mjs','utf8');
 assert.match(s,/r\.status!==400/);
 assert.match(s,/application\/json/);
 assert.match(s,/verifierProbeAuthorizesToken\(r\.status,probe\)/);
 assert.match(s,/catch\{return false;\}/);
 assert.doesNotMatch(s,/return r\.status!==401/);
 assert.match(s,/if\(!\(await tokenIsValid\(token\)\)\)return json\(\{ok:false,error:'UNAUTHORIZED'\},401\)/);
 assert.match(s,/MAX_VIDEO_BYTES=120\*1024\*1024/);
 assert.match(s,/safeOpenArtUrl\(mediaUrl\)/);
});
test('canonical verifier checks token BEFORE returning probe 400',()=>{
 const s=readFileSync('supabase/functions/powerhouse-instagram-media-verifier/index.ts','utf8');
 const a=s.indexOf("if(!expected||req.headers.get('x-powerhouse-token')!==expected)");
 const b=s.indexOf("error:'INVALID_INPUT'");
 assert.ok(a>0&&b>a);
 assert.match(s,/return json\(\{ok:false,error:'UNAUTHORIZED'\},401\)/);
});
