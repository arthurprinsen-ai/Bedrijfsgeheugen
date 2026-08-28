(()=>{
  'use strict';
  const params=new URLSearchParams(location.search);
  if(params.get('bg-runtime-probe')!=='1')return;

  const MAX_EVENTS=80;
  const PASS_ADVANCE_SECONDS=5.0;
  const OBSERVATION_TIMEOUT_MS=12000;
  const SAMPLE_INTERVAL_MS=500;
  const now=()=>new Date().toISOString();
  const round=n=>Math.round((Number(n)||0)*1000)/1000;
  const video=document.getElementById('heroBackgroundVideo');
  const evidence={
    schemaVersion: 1,
    probe:'hero-video-runtime',
    verdict:'PENDING',
    pageUrl:location.href,
    userAgent:navigator.userAgent,
    viewport:{width:innerWidth,height:innerHeight,devicePixelRatio:Number(devicePixelRatio)||1},
    source:video?.currentSrc||video?.querySelector('source')?.getAttribute('src')||'',
    startedAt:now(),
    updatedAt:now(),
    firstPlayingTime:null,
    maxCurrentTime:0,
    advanceSeconds:0,
    videoState:null,
    events:[],
    failureReason:''
  };
  window.__BG_RUNTIME_EVIDENCE__=evidence;

  let firstPlayingClock=null;
  let timeoutStarted=false;
  let sawError=false;

  const trimEvents=()=>{
    if(evidence.events.length>MAX_EVENTS)evidence.events.splice(0,evidence.events.length-MAX_EVENTS);
  };
  const snapshot=()=>{
    if(!video)return null;
    return {
      currentTime:round(video.currentTime),
      readyState:video.readyState,
      networkState:video.networkState,
      paused:Boolean(video.paused),
      ended:Boolean(video.ended)
    };
  };
  const update=()=>{
    evidence.updatedAt=now();
    evidence.videoState=snapshot();
    if(video){
      evidence.source=video.currentSrc||video.querySelector('source')?.getAttribute('src')||evidence.source;
      evidence.maxCurrentTime=Math.max(evidence.maxCurrentTime,round(video.currentTime));
      if(evidence.firstPlayingTime!==null)evidence.advanceSeconds=round(evidence.maxCurrentTime-evidence.firstPlayingTime);
      if(!sawError&&firstPlayingClock!==null&&evidence.advanceSeconds>=PASS_ADVANCE_SECONDS){
        evidence.verdict='PASS';
        evidence.failureReason='';
      }
    }
    render();
  };
  const record=type=>{
    evidence.events.push({at:now(),type,state:snapshot()});
    trimEvents();
    if(type==='error'){
      sawError=true;
      evidence.verdict='FAIL';
      evidence.failureReason='media-error';
    }
    if(type==='playing'&&firstPlayingClock===null){
      firstPlayingClock=Date.now();
      evidence.firstPlayingTime=round(video.currentTime);
      evidence.maxCurrentTime=evidence.firstPlayingTime;
      if(!timeoutStarted){
        timeoutStarted=true;
        setTimeout(()=>{
          update();
          if(evidence.verdict!=='PASS'&&!sawError){
            evidence.verdict='FAIL';
            evidence.failureReason=`playback-advanced-${evidence.advanceSeconds}s-in-12s`;
            evidence.updatedAt=now();
            render();
          }
        },OBSERVATION_TIMEOUT_MS);
      }
    }
    update();
  };

  let panel=null;
  let pre=null;
  const render=()=>{
    if(!panel)return;
    panel.dataset.verdict=evidence.verdict;
    pre.textContent=JSON.stringify(evidence,null,2);
  };
  const mountPanel=()=>{
    panel=document.createElement('section');
    panel.id='bgRuntimeEvidencePanel';
    panel.setAttribute('aria-label','Hero runtime evidence');
    panel.style.cssText='position:fixed;z-index:2147483647;right:8px;bottom:8px;width:min(92vw,420px);max-height:48vh;overflow:auto;background:#101418;color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:12px;padding:10px;font:12px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;box-shadow:0 8px 30px rgba(0,0,0,.35)';
    const title=document.createElement('div');
    title.textContent='Hero runtime evidence';
    title.style.cssText='font-weight:700;margin-bottom:6px';
    const copy=document.createElement('button');
    copy.type='button';
    copy.textContent='Kopieer bewijs';
    copy.style.cssText='margin:0 0 8px;padding:6px 9px;border-radius:7px;border:0;cursor:pointer';
    copy.addEventListener('click',async()=>{
      const text=JSON.stringify(evidence,null,2);
      try{await navigator.clipboard.writeText(text);copy.textContent='Gekopieerd';}
      catch{copy.textContent='Kopiëren mislukt';}
    });
    pre=document.createElement('pre');
    pre.style.cssText='white-space:pre-wrap;word-break:break-word;margin:0';
    panel.append(title,copy,pre);
    document.body.append(panel);
    render();
  };

  if(document.body)mountPanel();else addEventListener('DOMContentLoaded',mountPanel,{once:true});

  if(!video){
    evidence.verdict='FAIL';
    evidence.failureReason='hero-video-missing';
    evidence.events.push({at:now(),type:'missing',state:null});
    evidence.updatedAt=now();
    render();
    return;
  }

  for(const type of ['loadedmetadata','canplay','playing','pause','waiting','stalled','error','ended']){
    video.addEventListener(type,()=>record(type),{passive:true});
  }
  video.addEventListener('timeupdate',update,{passive:true});
  setInterval(update,SAMPLE_INTERVAL_MS);
  record('probe-start');
})();
