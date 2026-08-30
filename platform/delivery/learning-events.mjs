import { createHash } from 'node:crypto';

const MATERIAL=new Set(['CHANGE_PROPOSED','CHANGE_GREEN','CHANGE_PROMOTED','CHANGE_SUPERSEDED','CONFLICT_RECONCILED','PLATFORM_REGISTERED','PRODUCTION_ROLLBACK','CONTRACT_CHANGE']);
const clean=v=>String(v??'').trim();

export function isMaterialDeliveryEvent(kind){return MATERIAL.has(clean(kind).toUpperCase());}

export function fingerprintDeliveryEvent(event={}){
  const canonical=[clean(event.kind).toUpperCase(),clean(event.platform).toLowerCase(),clean(event.changeId),clean(event.candidateVersion)].join('|');
  return `delivery|${createHash('sha256').update(canonical).digest('hex').slice(0,24)}`;
}

export const MATERIAL_DELIVERY_EVENTS=Object.freeze([...MATERIAL]);
