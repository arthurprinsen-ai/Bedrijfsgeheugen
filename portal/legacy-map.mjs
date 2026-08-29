import { LEGACY_CAPABILITIES, NAV_ITEMS } from './core.mjs';
const LEGACY_ROUTE_MAP=new Map(LEGACY_CAPABILITIES.map(item=>[item.id,item]));
const CANONICAL_TOP=new Set(NAV_ITEMS.map(x=>x.id));
export function resolvePortalRoute(input=''){const raw=String(input||'').replace(/^#\/?/,'').replace(/^\/+/, '').trim();if(!raw)return{route:'today',legacyId:null};const legacy=LEGACY_ROUTE_MAP.get(raw);if(legacy)return{route:legacy.canonicalRoute,legacyId:legacy.id};const top=raw.split('/')[0];if(CANONICAL_TOP.has(top))return{route:raw,legacyId:null};return{route:'today',legacyId:null}}
export function legacyHref(id){const resolved=resolvePortalRoute(id);return '#/'+resolved.route}
