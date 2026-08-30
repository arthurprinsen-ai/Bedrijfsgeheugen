const clean=v=>typeof v==='string'?v.trim():'';
const lower=v=>clean(v).toLowerCase();
const list=v=>Array.isArray(v)?v:[];
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
function json(storage,key,fallback=null){try{const raw=storage?.getItem?.(key);return raw?JSON.parse(raw):fallback}catch{return fallback}}
function row(v,keys){const out={};for(const key of keys){if(v?.[key]!==undefined)out[key]=clone(v[key])}return out}
function safePart(part,selectedIds){const p=row(part,['id','vast','prijs','scherm','titel','kort']);p.selected=Boolean(part?.vast||selectedIds.has(String(part?.id||'')));p.stories=list(part?.stories).map(x=>list(x).slice(0,3).map(clean));p.sprints=list(part?.sprints).map(x=>row(x,['titel','wat','op']));p.koppelingen=list(part?.koppelingen).map(x=>row(x,['naam','wat','week']));p.documenten=list(part?.documenten).map(x=>row(x,['naam','week']));return p}
function safeAgreement(v){if(!v||typeof v!=='object')return null;const a=row(v,['naam','functie','datum']);return clean(a.naam)||clean(a.datum)?a:null}
export function readLegacyOffer({storage,extraStorage=null,slug='',user=null,allowDemo=true}={}){
 const id=lower(slug);if(!id||!storage?.getItem)return null;
 const raw=json(storage,`bg_klant_${id}`);if(!raw||typeof raw!=='object'||!Array.isArray(raw.onderdelen))return null;
 if(id==='demo'){if(!allowDemo)return null}else{const email=lower(user?.email);const allowed=list(raw.emails).map(lower).filter(Boolean);if(!email||!allowed.includes(email))return null}
 const extras=list(json(extraStorage,`bg_meerwerk_${id}`,[]));const selectedIds=new Set(extras.map(x=>String(x?.id||'')).filter(Boolean));
 const localAgreement=json(extraStorage,`bg_akkoord_${id}`,null);const offer=row(raw,['naam','logo','titel','geldig','domein','actief','voortgang','gestart']);offer.slug=id;offer.onderdelen=raw.onderdelen.map(x=>safePart(x,selectedIds));offer.getekend=safeAgreement(localAgreement)||safeAgreement(raw.getekend);return offer;
}
