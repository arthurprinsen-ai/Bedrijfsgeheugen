import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';

const SOURCE='zelfscan.html';
const SNAPSHOT='.bg-build/bedrijfslek-source.html';

function assertCanonical(html,label){
  const required=[
    'Gratis Bedrijfslek · 12 vragen · 3 minuten',
    'Waar lekt tijd, geld en kennis uit jouw bedrijf?',
    'Geen formulier, geen e-mailmuur, geen verkoopgesprek nodig',
    'Drie acties die je morgen kunt nemen',
    'Start met het portaal',
    'data-bg-page-runtime="bedrijfslek-engine"'
  ];
  for(const marker of required){
    if(!html.includes(marker)) throw new Error(`BEDRIJFSLEK_INTEGRITY_MISSING:${label}:${marker}`);
  }
  if(/Beantwoord zes vragen/i.test(html)) throw new Error(`BEDRIJFSLEK_INTEGRITY_LEGACY_SIX_QUESTIONS:${label}`);
  if(/id="scanform"/i.test(html)) throw new Error(`BEDRIJFSLEK_INTEGRITY_LEAD_GATE:${label}`);
}

export async function captureBedrijfslek(){
  const source=await readFile(SOURCE,'utf8');
  assertCanonical(source,'capture-source');
  await mkdir('.bg-build',{recursive:true});
  await writeFile(SNAPSHOT,source,'utf8');
  console.log('Bedrijfslek canonical source captured before legacy website builders');
}

export async function restoreBedrijfslek(){
  const source=await readFile(SNAPSHOT,'utf8');
  assertCanonical(source,'snapshot');
  await writeFile(SOURCE,source,'utf8');
  const restored=await readFile(SOURCE,'utf8');
  assertCanonical(restored,'restored-source');
  await rm(SNAPSHOT,{force:true});
  console.log('Bedrijfslek canonical source restored before final shell/i18n projection');
}

const mode=process.argv[2];
if(mode==='capture') await captureBedrijfslek();
else if(mode==='restore') await restoreBedrijfslek();
else throw new Error('Usage: node tools/site-shell/bedrijfslek-build-integrity.mjs <capture|restore>');
