import fs from 'node:fs';

export const REQUIRED_TEXT=Object.freeze([
  'Powerhouse SaaS',
  'Consulting & workshops',
  'Starter',
  'Pro',
  'Groei',
  'Enterprise',
  'Directie & AI Workshop',
  'Bedrijfsgeheugen Scan',
  'Build Sprint',
  'Transformation / Fractional Lead',
  'Combineer zonder dubbel te betalen'
]);

export function normalizePricingHtml(html=''){
  return String(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/\s+/g,' ')
    .trim();
}

export function verifyPricingProductionContent(html=''){
  const source=String(html);
  const text=normalizePricingHtml(source);
  const missingText=REQUIRED_TEXT.filter(item=>!text.includes(item));
  return Object.freeze({ok:missingText.length===0,missingText});
}

if(import.meta.url===`file://${process.argv[1]}`){
  const file=process.argv[2];
  if(!file){console.error('usage: node verify-pricing-production-content.mjs <html-file>');process.exit(2);}
  const result=verifyPricingProductionContent(fs.readFileSync(file,'utf8'));
  if(!result.ok){
    console.error('PRICING_PRODUCTION_CONTRACT_MISMATCH',JSON.stringify(result));
    process.exit(1);
  }
  console.log('PRICING_PRODUCTION_CONTRACT_OK');
}
