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

function decodeCandidate(candidate) {
  const bytes = [];
  for (const char of candidate) {
    const byte = cp1252Byte(char);
    if (byte === null) return null;
    bytes.push(byte);
  }
  const repaired = Buffer.from(bytes).toString('utf8');
  if (repaired.includes('\uFFFD')) return null;
  return repaired;
}

function repairPass(text) {
  let out = '';
  for (let index = 0; index < text.length;) {
    const lead = text[index];
    const width = lead === 'â' ? 3 : (lead === 'Ã' || lead === 'Â' ? 2 : 0);
    if (width && index + width <= text.length) {
      const candidate = text.slice(index, index + width);
      const decoded = decodeCandidate(candidate);
      if (decoded && decoded !== candidate && !decoded.includes('\uFFFD')) {
        out += decoded;
        index += width;
        continue;
      }
    }
    out += lead;
    index += 1;
  }
  return out;
}

export function repairUtf8Mojibake(input) {
  let text = String(input ?? '');
  if (!/[ÃÂâ]/.test(text)) return text;
  for (let pass = 0; pass < 3; pass += 1) {
    const repaired = repairPass(text);
    if (repaired === text) break;
    text = repaired;
  }
  return text;
}

const MOJIBAKE_PATTERN = /(?:Ã|Â)[\u0080-\u00ff]|â(?:[\u0080-\u00ff€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ])/u;

export async function repairWijzigingenEncoding(file = 'wijzigingen-uitgelegd.html') {
  const original = await readFile(file, 'utf8');
  const repaired = repairUtf8Mojibake(original);
  if (MOJIBAKE_PATTERN.test(repaired)) {
    throw new Error('wijzigingen-uitgelegd bevat nog UTF-8 mojibake na herstel');
  }
  if (!/\.rail\{[^}]*min-height\s*:\s*76px/is.test(repaired)) {
    throw new Error('wijzigingen-uitgelegd mist de gereserveerde 76px railhoogte');
  }
  if (repaired !== original) await writeFile(file, repaired, 'utf8');
  return { changed: repaired !== original };
}
