// Original Kansenradar source provenance gate. Multi-story headlines must never
// be paired with an arbitrary extract from another story in the same roundup.
// This is a deliberately conservative admission filter, NOT semantic proof that
// all other article summaries are correct. Keep real source URLs in evidence.
export const KANSENRADAR_SOURCE_GATE_CONTRACT = 'bg-kansenradar-single-story-source-v1';
const MULTI_STORY_PATH = /(?:^|\/)(?:nieuwsupdate|nieuwsoverzicht|news-roundup|daily-roundup|nieuws-in-het-kort)(?:[-/]|$)/i;

export function classifyKansenradarSource(candidate) {
  const url = typeof candidate?.url === 'string' ? candidate.url.trim() : '';
  if (!url) return {accepted:false,reason:'SOURCE_URL_REQUIRED',url};
  let parsed;
  try { parsed = new URL(url); } catch { return {accepted:false,reason:'SOURCE_URL_INVALID',url}; }
  if (!['http:','https:'].includes(parsed.protocol) || !parsed.hostname) {
    return {accepted:false,reason:'SOURCE_URL_INVALID',url};
  }
  if (MULTI_STORY_PATH.test(decodeURIComponent(parsed.pathname))) {
    return {accepted:false,reason:'MULTI_STORY_HEADLINE_HOOK_UNBOUND',url};
  }
  // Passing means one known hazardous class excluded; source-to-hook must
  // still be corroborated by the original editorial reviewer downstream.
  return {accepted:true,reason:'SINGLE_STORY_URL_PATTERN_ACCEPTED',url};
}
