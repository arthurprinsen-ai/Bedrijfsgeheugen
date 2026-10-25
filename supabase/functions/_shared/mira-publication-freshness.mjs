/**
 * Publication-date evidence for public Mira topics. Observation/crawl time is
 * never a substitute for the actual article publication date.
 * Untrusted search snippets must not claim fresh news without an explicit date.
 */
const MONTHS=Object.freeze({
 jan:1,januari:1,feb:2,februari:2,mrt:3,maart:3,mar:3,march:3,
 apr:4,april:4,mei:5,may:5,jun:6,juni:6,june:6,jul:7,juli:7,july:7,
 aug:8,augustus:8,sep:9,sept:9,september:9,oct:10,okt:10,oktober:10,october:10,
 nov:11,november:11,dec:12,december:12
});
const DAY=86400000;
function utcDate(y,m,d){
  if(!Number.isInteger(y)||y<2000||y>2100||!Number.isInteger(m)||m<1||m>12||!Number.isInteger(d)||d<1||d>31)return null;
  const date=new Date(Date.UTC(y,m-1,d));
  return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?date:null;
}
function dateFromText(text){
  const source=String(text??'').trim().slice(0,130);
  // Publication date is normally at the start of a search excerpt. Never
  // infer from arbitrary dates deep in article content.
  const iso=source.match(/^(?:published(?:\s+on)?[:\s]+|gepubliceerd(?:\s+op)?[:\s]+)?(20\d{2})-(\d{1,2})-(\d{1,2})(?:[T\s]|$)/i);
  if(iso)return utcDate(Number(iso[1]),Number(iso[2]),Number(iso[3]));
  const dutch=source.match(/^(?:(?:gepubliceerd|published)(?:\s+(?:op|on))?[:\s]+)?(\d{1,2})[ .-]+(jan(?:uari)?|feb(?:ruari)?|mrt|maart|mar(?:ch)?|apr(?:il)?|mei|may|jun(?:i|e)?|jul(?:i|y)?|aug(?:ustus)?|sep(?:t(?:ember)?)?|okt(?:ober)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[ .,-]+(20\d{2})\b/i);
  if(dutch)return utcDate(Number(dutch[3]),MONTHS[dutch[2].toLowerCase()],Number(dutch[1]));
  return null;
}
function fromProvider(v){
  if(!v)return null;
  const raw=String(v).trim();
  // Require an explicit 4-digit publication year; timestamps of search/crawl
  // requests and relative "days ago" are not trustworthy article dates.
  const match=raw.match(/^(20\d{2})-(\d{2})-(\d{2})(?:T.*)?$/);
  return match?utcDate(Number(match[1]),Number(match[2]),Number(match[3])):dateFromText(raw);
}
export function evaluateMiraPublicationFreshness({providerPublishedAt=null,title='',excerpt='',observedAt=Date.now()}={}){
  const observed=observedAt instanceof Date?observedAt.getTime():Number(observedAt);
  if(!Number.isFinite(observed))throw new Error('OBSERVATION_TIMESTAMP_INVALID');
  const provider=fromProvider(providerPublishedAt);
  const snippet=dateFromText(excerpt)||dateFromText(title);
  if(provider&&snippet&&Math.abs(provider.getTime()-snippet.getTime())>7*DAY){
    return Object.freeze({status:'CONFLICTING_PUBLICATION_DATES',publishedAt:null,ageDays:null,score:0,eligible:false});
  }
  const date=snippet||provider;
  if(!date)return Object.freeze({status:'PUBLICATION_DATE_UNKNOWN',publishedAt:null,ageDays:null,score:0,eligible:false});
  const ageDays=Math.floor((observed-date.getTime())/DAY);
  if(ageDays<0)return Object.freeze({status:'FUTURE_PUBLICATION_DATE',publishedAt:date.toISOString(),ageDays,score:0,eligible:false});
  if(ageDays>60)return Object.freeze({status:'STALE_PUBLICATION',publishedAt:date.toISOString(),ageDays,score:0,eligible:false});
  const score=ageDays<=14?1:ageDays<=30?0.85:0.5;
  return Object.freeze({status:'FRESH_PUBLICATION_CONFIRMED',publishedAt:date.toISOString(),ageDays,score,eligible:true});
}
