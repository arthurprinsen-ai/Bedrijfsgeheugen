function memoryStore(){const map=new Map();return{getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)}}
const same=(a,b)=>{try{return JSON.stringify(a)===JSON.stringify(b)}catch{return a===b}};
export function createPortalDataAdapter({loadLive,loadRemote,storage=typeof sessionStorage!=='undefined'?sessionStorage:memoryStore(),now=()=>Date.now(),ttlMs=60000,cacheKey='bg.portal.state.v3',fallbackState=null}={}){
 const loader=loadLive||loadRemote||(async()=>null);
 const readCache=()=>{try{const raw=storage.getItem(cacheKey);if(!raw)return null;const parsed=JSON.parse(raw);return parsed&&parsed.state?parsed:null}catch{return null}};
 const writeCache=state=>{try{storage.setItem(cacheKey,JSON.stringify({savedAt:now(),state}))}catch{}return state};
 const isFresh=entry=>Boolean(entry&&(now()-entry.savedAt)<ttlMs);
 async function loadInitial(){const cached=readCache();if(cached)return{state:cached.state,source:'cache',stale:!isFresh(cached),error:null};try{const live=await loader();if(live)return{state:writeCache(live),source:'live',stale:false,error:null}}catch(error){return{state:fallbackState,source:'empty',stale:false,error}}return{state:fallbackState,source:'empty',stale:false,error:null}}
 async function refresh(){const cached=readCache();try{const live=await loader();if(live){const changed=!same(cached?.state,live);if(changed)writeCache(live);return{state:live,source:'live',changed,error:null}}}catch(error){return{state:cached?.state||fallbackState,source:cached?'cache':'empty',changed:false,error}}return{state:cached?.state||fallbackState,source:cached?'cache':'empty',changed:false,error:null}}
 return{loadInitial,refresh,getCached:()=>readCache()?.state||null};
}
