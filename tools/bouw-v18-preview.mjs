import { readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';

const chunkPaths = Array.from({ length: 7 }, (_, i) => `v18-full/chunk-${String(i).padStart(2, '0')}.txt`);
const parts = await Promise.all(chunkPaths.map(path => readFile(path, 'utf8')));
const base64 = parts.join('').replace(/\s+/g, '');
const html = gunzipSync(Buffer.from(base64, 'base64')).toString('utf8');
await writeFile('prototype-v18-8.html', html, 'utf8');
await writeFile('prototype-v18-9.html', html, 'utf8');
console.log(`V18 preview built as static HTML: ${Buffer.byteLength(html)} bytes`);
