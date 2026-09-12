import { readFile, writeFile } from 'node:fs/promises';

const CP1252_REVERSE = new Map([
  ['€', 0x80], ['‚', 0x82], ['ƒ', 0x83], ['„', 0x84], ['…', 0x85],
  ['†', 0x86], ['‡', 0x87], ['ˆ', 0x88], ['‰', 0x89], ['Š', 0x8a],
  ['‹', 0x8b], ['Œ', 0x8c], ['Ž', 0x8e], ['‘', 0x91], ['’', 0x92],
  ['“', 0x93], ['”', 0x94], ['•', 0x95], ['–', 0x96], ['—', 0x97],
  ['˜', 0x98], ['™', 0x99], ['š', 0x9a], ['›', 0x9b], ['œ', 0x9c],
  ['ž', 0x9e], ['Ÿ', 0x9f],
]);

function cp1252Byte(char) {
  const code = char.codePointAt(0);
  if (code <= 0xff) return code;
  return CP1252_REVERSE.get(char) ?? null;
}

export function repairUtf8Mojibake(input) {
  const text = String(input ?? '');
  if (!/[ÃÂâ]/.test(text)) return text;

  const bytes = [];
  for (const char of text) {
    const byte = cp1252Byte(char);
    if (byte === null) return text;
    bytes.push(byte);
  }
  const repaired = Buffer.from(bytes).toString('utf8');
  return repaired.includes('\uFFFD') ? text : repaired;
}

export async function repairWijzigingenEncoding(file = 'wijzigingen-uitgelegd.html') {
  const original = await readFile(file, 'utf8');
  const repaired = repairUtf8Mojibake(original);
  if (/[ÃÂâ](?:.|$)/.test(repaired)) {
    throw new Error('wijzigingen-uitgelegd bevat nog UTF-8 mojibake na herstel');
  }
  if (!/\.rail\{[^}]*min-height\s*:\s*76px/is.test(repaired)) {
    throw new Error('wijzigingen-uitgelegd mist de gereserveerde 76px railhoogte');
  }
  if (repaired !== original) await writeFile(file, repaired, 'utf8');
  return { changed: repaired !== original };
}
