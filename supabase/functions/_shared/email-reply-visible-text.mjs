// Canonical Gmail reply-loop helpers: classify only the text written by the
// recipient. The original outbound mail always includes an opt-out footer;
// quoted copies of that footer are NOT a recipient unsubscribe request.
// These are pure text guards. They never grant email-send permission.
const clean=v=>String(v??'').replace(/\r\n?/g,'\n').trim();
const QUOTE_HEADER=[
  /^on .{3,180} wrote:\s*$/i,
  /^op .{3,180} schreef(?::| .{0,50}:)\s*$/i,
  /^-{2,}\s*(?:original message|oorspronkelijk bericht|forwarded message)\s*-{2,}$/i,
  /^_{6,}\s*$/,
  /^(?:from|van):\s+.{3,}$/i,
  /^<blockquote\b/i,
  /^<div\b[^>]*\b(?:gmail_quote|yahoo_quoted)\b/i
];
const OUR_OPT_OUT_FOOTER=/^wil je geen (?:berichten|mail|e-mails?) meer van mij\?\s*antwoord met\s*["'“”]?afmelden/i;

// This is not an HTML sanitizer or renderer. If markup is present, accept
// ONLY harmless structural tags and reject the entire reply on any unknown,
// incomplete, or malformed token. Never pass a partially stripped HTML string.
function strictlyVisibleHtmlText(html){
  let output='',offset=0;
  while(offset<html.length){
    const open=html.indexOf('<',offset);
    const plain=html.slice(offset,open<0?html.length:open);
    if(plain.includes('>'))return '';
    output+=plain;
    if(open<0)break;
    const close=html.indexOf('>',open+1);
    if(close<0)return '';
    const token=html.slice(open+1,close).trim();
    if(!/^\/?(?:div|p|span|br|li)\b(?:\s+(?:class|dir|style|id)\s*=\s*(?:"[^"<>]*"|'[^'<>]*'))*\s*\/?$/i.test(token))return '';
    if(/^\/(?:div|p|li)\b/i.test(token)||/^br\b/i.test(token))output+='\n';
    offset=close+1;
  }
  return output.replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&quot;|&#34;/gi,'"').replace(/&amp;/gi,'&');
}

export function extractVisibleEmailReply(raw){
  const body=clean(raw).slice(0,24000);
  // Some Gmail/Composio payloads use HTML instead of plain text. Strip the
  // quoted HTML subtree BEFORE flattening tags or matching unsubscribe terms.
  const unquotedHtml=body.split(/<(?:div\b[^>]*\b(?:gmail_quote|yahoo_quoted)\b|blockquote\b)[^>]*>/i)[0];
  const normalized=unquotedHtml.includes('<')||unquotedHtml.includes('>')
    ?strictlyVisibleHtmlText(unquotedHtml)
    :unquotedHtml;
  const lines=normalized.split('\n');
  const visible=[];
  for(const line of lines){
    const t=line.trim();
    if(QUOTE_HEADER.some(regex=>regex.test(t))||OUR_OPT_OUT_FOOTER.test(t))break;
    if(t.startsWith('>'))continue;
    if(t==='--'&&visible.length)break;
    visible.push(line);
  }
  return visible.join('\n').trim().slice(0,6000);
}
export function isExplicitUnsubscribeReply(raw){
  // Even inline references to the original sender's own opt-out instruction
  // are not recipient instructions. Remove the exact quoted instruction before
  // testing recipient-authored opt-out intent.
  const text=extractVisibleEmailReply(raw)
    .replace(/wil je geen (?:berichten|mail|e-mails?) meer van mij\?\s*antwoord met\s*["'“”]?afmelden["'“”]?(?:\s+en ik mail je niet meer)?\.?/gi,'')
    .replace(/\s+/g,' ').toLowerCase().trim();
  if(!text)return false;
  // A mention of the unsubscribe instructions is not a request to unsubscribe.
  if(/\b(?:niet|no|don't|do not)\s+(?:me |mij )?(?:afmelden|uitschrijven|unsubscribe)\b/i.test(text))
    return false;
  if(/^(?:afmelden|uitschrijven|unsubscribe|stop)(?:\s+(?:mij|me))?[.!]?$/.test(text))return true;
  return [
    /\b(?:ik wil|ik wens|ik zou graag)\s+(?:me |mij )?(?:graag )?(?:afmelden|uitschrijven)\b/,
    /\b(?:meld|schrijf)\s+(?:me|mij)\s+(?:af|uit)\b/,
    /\b(?:graag|kun je|kunt u|wil je|wilt u)\s+(?:me |mij )?(?:afmelden|uitschrijven)\b/,
    /\b(?:mail|mailt|mailen)\s+(?:me|mij)\s+niet meer\b/,
    /\b(?:niet meer mailen|geen mail(?:s|tjes)? meer|geen e-mails? meer|geen berichten meer)\b/,
    /\b(?:verwijder mij|haal mij van (?:de |jullie )?(?:mailing)?lijst|do not contact|stop emailing|no more emails)\b/,
    /\b(?:please|kindly)\s+(?:unsubscribe|remove me)\b/
  ].some(re=>re.test(text));
}
