import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ffmpegPath from 'ffmpeg-static';
import {verifierProbeAuthorizesToken} from './_instagram-frame-auth-contract.mjs';
import {instagramFrameSamplePoints} from './_instagram-frame-sampling.mjs';
import {parseNativeVideoDimensions,checkNativeMiraReelDimensions} from './_instagram-native-reel-probe.mjs';

const execFileAsync=promisify(execFile);
const SUPABASE='https://adhjwmvyoixzjtmiroln.supabase.co';
const MAX_VIDEO_BYTES=120*1024*1024;
const MAX_DURATION=60;

const json=(body,status=200)=>new Response(JSON.stringify(body),{
  status,
  headers:{'content-type':'application/json','cache-control':'no-store'}
});
const clean=v=>String(v??'').trim();

async function tokenIsValid(token){
  if(!token)return false;
  try{
    // Only the canonical verifier's authenticated empty-payload response is proof.
    const r=await fetch(`${SUPABASE}/functions/v1/powerhouse-instagram-media-verifier`,{
      method:'POST',
      headers:{'content-type':'application/json','x-powerhouse-token':token},
      body:'{}'
    });
    if(r.status!==400||!clean(r.headers.get('content-type')).toLowerCase().startsWith('application/json'))return false;
    const probe=await r.json().catch(()=>null);
    return verifierProbeAuthorizesToken(r.status,probe);
  }catch{return false;}
}
function safeOpenArtUrl(raw){
  const u=new URL(raw);
  if(u.protocol!=='https:'||u.hostname!=='cdn.openart.ai')throw new Error('OPENART_CDN_URL_REQUIRED');
  if(!u.pathname.toLowerCase().endsWith('.mp4'))throw new Error('OPENART_MP4_REQUIRED');
  return u;
}
async function extractFrame(input,output,seconds){
  await execFileAsync(ffmpegPath,[
    '-hide_banner','-loglevel','error','-ss',String(seconds),'-i',input,
    '-frames:v','1','-vf','scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
    '-q:v','2','-y',output
  ],{timeout:20000,maxBuffer:1024*1024});
  return readFile(output);
}

export default async (request)=>{
  if(request.method!=='POST')return json({ok:false,error:'POST_ONLY'},405);
  const token=clean(request.headers.get('x-powerhouse-token'));
  if(!(await tokenIsValid(token)))return json({ok:false,error:'UNAUTHORIZED'},401);

  let body={}; try{ body=await request.json(); }catch{}
  const mediaUrl=clean(body.mediaUrl);
  const duration=Number(body.duration||0);
  if(!mediaUrl||!Number.isFinite(duration)||duration<=0||duration>MAX_DURATION)
    return json({ok:false,error:'INVALID_INPUT'},400);

  let dir='';
  try{
    const url=safeOpenArtUrl(mediaUrl);
    const response=await fetch(url,{redirect:'follow'});
    if(!response.ok)throw new Error('MEDIA_FETCH_FAILED');
    const declared=Number(response.headers.get('content-length')||0);
    if(declared>MAX_VIDEO_BYTES)throw new Error('MEDIA_TOO_LARGE');
    const bytes=new Uint8Array(await response.arrayBuffer());
    if(!bytes.length||bytes.length>MAX_VIDEO_BYTES)throw new Error('MEDIA_SIZE_INVALID');

    dir=await mkdtemp(join(tmpdir(),'ig-proof-'));
    const input=join(dir,'source.mp4');
    await writeFile(input,bytes);

    // Probe the ORIGINAL MP4 before any resize/pad or expensive vision call.
    // Never trust caller-provided dimensions or infer native size from 1080x1920 JPG output.
    const result=await execFileAsync(ffmpegPath,[
      '-hide_banner','-i',input,'-map','0:v:0','-frames:v','0','-f','null','-'
    ],{timeout:20000,maxBuffer:1024*1024});
    const actual=checkNativeMiraReelDimensions(parseNativeVideoDimensions(result.stderr||''));
    if(!actual.ok)return json({ok:false,error:actual.error,
       native_dimensions_verified:actual.error==='MIRA_NATIVE_VIDEO_DIMENSIONS_MISMATCH',
       actual_width:actual.width??null,actual_height:actual.height??null,
       required_width:1080,required_height:1920,contract:actual.contract},422);
    if(body.probeOnly===true){
      return json({ok:true,contract:actual.contract,mediaUrl,
        native_dimensions_verified:true,native_width:actual.width,native_height:actual.height,
        frames:[]});
    }
    const points=instagramFrameSamplePoints(duration);
    const frames=[];
    for(const [position,seconds] of points){
      const out=join(dir,`${position}.jpg`);
      const frame=await extractFrame(input,out,seconds);
      frames.push({position,seconds,mediaType:'image/jpeg',imageBase64:frame.toString('base64')});
    }
    return json({ok:true,contract:'instagram-exact-video-frame-extraction-v2',native_contract:actual.contract,native_dimensions_verified:true,native_width:actual.width,native_height:actual.height,mediaUrl,duration,frames});
  }catch(error){
    return json({ok:false,error:clean(error?.message||error).slice(0,200)},422);
  }finally{
    if(dir)await rm(dir,{recursive:true,force:true}).catch(()=>{});
  }
};
