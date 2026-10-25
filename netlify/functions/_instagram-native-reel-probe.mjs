// Parse measured ORIGINAL media stream metadata, never padded/resized JPEG frames.
// ffmpeg-static is already shipped with the existing Netlify frame extractor.
export const MIRA_NATIVE_REEL_WIDTH=1080;
export const MIRA_NATIVE_REEL_HEIGHT=1920;
export const MIRA_NATIVE_FORMAT_CONTRACT='mira-exact-native-mp4-before-vision-v1';

export function parseNativeVideoDimensions(ffmpegStderr=''){
  const line=String(ffmpegStderr).split(/\r?\n/).find(s=>/Stream #\d+:\d+(?:\[[^\]]+\])?(?:\([^)]*\))?: Video:/i.test(s));
  if(!line)return {ok:false,error:'VIDEO_STREAM_METADATA_UNAVAILABLE'};
  const hit=line.match(/\b(\d{2,5})x(\d{2,5})(?:\s|\[|,|$)/);
  if(!hit)return {ok:false,error:'VIDEO_STREAM_DIMENSIONS_UNAVAILABLE'};
  const width=Number(hit[1]),height=Number(hit[2]);
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<=0||height<=0)
    return {ok:false,error:'VIDEO_STREAM_DIMENSIONS_INVALID'};
  return {ok:true,width,height};
}

export function checkNativeMiraReelDimensions(measurement){
 const width=Number(measurement?.width),height=Number(measurement?.height);
 if(measurement?.ok!==true||!Number.isInteger(width)||!Number.isInteger(height))
   return {ok:false,error:'MIRA_NATIVE_VIDEO_DIMENSIONS_UNVERIFIED',contract:MIRA_NATIVE_FORMAT_CONTRACT};
 if(width!==MIRA_NATIVE_REEL_WIDTH||height!==MIRA_NATIVE_REEL_HEIGHT)
   return {ok:false,error:'MIRA_NATIVE_VIDEO_DIMENSIONS_MISMATCH',width,height,
     required_width:MIRA_NATIVE_REEL_WIDTH,required_height:MIRA_NATIVE_REEL_HEIGHT,
     contract:MIRA_NATIVE_FORMAT_CONTRACT};
 return {ok:true,width,height,contract:MIRA_NATIVE_FORMAT_CONTRACT};
}
