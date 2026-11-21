// One deterministic brand signature for the ORIGINAL autonomous Gmail sender.
// No tracking pixel, remote font, click redirect, extra sender or invented identity.
// All links in href use complete HTTPS URLs. Logo text survives image blocking.
export const BEDRIJFSGEHEUGEN_SITE='https://www.bedrijfsgeheugen.nl/';
export const BEDRIJFSGEHEUGEN_LOGO='https://www.bedrijfsgeheugen.nl/assets/merk/logo-merk.png';
export const OPT_OUT_TEXT='Wil je geen berichten meer van mij? Antwoord met "afmelden".';
const escapeHtml=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
function contentParagraphs(body){
 const blocks=String(body||'').trim().split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
 return blocks.map(block=>'<p style="margin:0 0 14px 0;line-height:1.55">'+escapeHtml(block).replace(/\n/g,'<br>')+'</p>').join('');
}
export function renderBrandedOutreachHtml(body,{includeOptOut=true}={}){
 const message=String(body??'').trim();
 if(!message)throw new Error('OUTREACH_BRAND_EMPTY_BODY');
 return '<div style="font:15px/1.55 Arial,Helvetica,sans-serif;color:#172338;max-width:620px">'+
   contentParagraphs(message)+
   '<table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:18px"><tr>'+
   '<td style="vertical-align:middle;padding:0 12px 0 0">'+
   '<a href="'+BEDRIJFSGEHEUGEN_SITE+'" style="text-decoration:none">'+
   '<img src="'+BEDRIJFSGEHEUGEN_LOGO+'" width="42" height="42" alt="Bedrijfsgeheugen" style="display:block;width:42px;height:42px;border:0" />'+
   '</a></td>'+
   '<td style="vertical-align:middle;color:#172338;font:13px/1.45 Arial,Helvetica,sans-serif">'+
   '<strong style="font-size:14px">Arthur Prinsen</strong><br>'+
   'Oprichter · <strong>Bedrijfsgeheugen</strong><br>'+
   '<a href="'+BEDRIJFSGEHEUGEN_SITE+'" style="color:#1645b4;text-decoration:underline">'+BEDRIJFSGEHEUGEN_SITE+'</a><br>'+
   '<a href="mailto:arthur@bedrijfsgeheugen.nl" style="color:#1645b4;text-decoration:underline">arthur@bedrijfsgeheugen.nl</a>'+
   '</td></tr></table>'+
   (includeOptOut?'<p style="margin:20px 0 0;color:#637083;font-size:11px">'+escapeHtml(OPT_OUT_TEXT)+'</p>':'')+
   '</div>';
}
export function renderBrandedOutreachPlainText(body,{includeOptOut=true}={}){
 return String(body??'').trim()+'\n\nArthur Prinsen\nOprichter · Bedrijfsgeheugen\n'+
 BEDRIJFSGEHEUGEN_SITE+'\narthur@bedrijfsgeheugen.nl'+(includeOptOut?'\n\n'+OPT_OUT_TEXT:'');
}
