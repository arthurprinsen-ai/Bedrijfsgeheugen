import {readFile} from 'node:fs/promises';

function decode(text=''){
  return String(text)
    .replace(/&amp;/g,'&')
    .replace(/&nbsp;|&#160;/g,' ')
    .replace(/&euro;|&#8364;/g,'€')
    .replace(/&#39;|&apos;/g,"'")
    .replace(/&quot;/g,'"')
    .replace(/<[^>]*>/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

export function verifyPricingProductionContent(html=''){
  const source=String(html);
  const text=decode(source);
  const missing=[];
  const textTokens=[
    'Powerhouse SaaS','Starter','Pro','Groei','Enterprise',
    'Directie & AI Workshop','Bedrijfsgeheugen Scan','Build Sprint',
    'Transformation / Fractional Lead','Combineer zonder dubbel te betalen'
  ];
  for(const token of textTokens) if(!text.includes(token)) missing.push(`text:${token}`);

  const structural=[
    ['tab:saas',/data-tab=["']saas["']/i],
    ['tab:consulting',/data-tab=["']consulting["']/i],
    ['panel:saas',/data-panel=["']saas["']/i],
    ['panel:consulting',/data-panel=["']consulting["']/i]
  ];
  for(const [name,re] of structural) if(!re.test(source)) missing.push(name);

  return Object.freeze({ok:missing.length===0,missing:Object.freeze(missing),text});
}

async function main(){
  const file=process.argv[2];
  if(!file) throw new Error('PRICING_HTML_PATH_REQUIRED');
  const html=await readFile(file,'utf8');
  const result=verifyPricingProductionContent(html);
  if(!result.ok){
    console.error('PRICING_PRODUCTION_CONTENT_MISMATCH',JSON.stringify({missing:result.missing}));
    process.exitCode=1;
    return;
  }
  console.log('PRICING_PRODUCTION_CONTENT_PROVEN');
}

if(import.meta.url===new URL(`file://${process.argv[1]}`).href) main().catch(error=>{console.error(error);process.exitCode=1;});
