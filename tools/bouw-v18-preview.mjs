import { readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const FILES = [
  'v18-full/chunk-00.txt','v18-full/chunk-gap.txt','v18-full/chunk-01.txt','v18-full/chunk-02.txt',
  'v18-full/chunk-03-0.txt','v18-full/chunk-03-1a.txt','v18-full/chunk-03-1b.txt','v18-full/chunk-03-2.txt',
  'v18-full/chunk-03-3.txt','v18-full/chunk-03-4.txt','v18-full/chunk-03-5a0.txt','v18-full/chunk-03-5a1.txt','v18-full/chunk-03-5b.txt',
  'v18-full/chunk-04.txt','v18-full/chunk-05.txt','v18-full/chunk-06.txt'
];

const EXPECTED_BASE64_LENGTH = 108484;
const EXPECTED_BASE64_SHA256 = '64c33847585fb3d93e3a4bbe8bfd33aee5221678a047f613f6144330f69e305b';
const EXPECTED_HTML_SHA256 = 'be938e95870994b89773d141a400318a1be3eac4829d69aac6bac48942bd230b';
const CONTROL_SOURCE = 'https://videos.pexels.com/video-files/35649915/15107522_1920_1080_30fps.mp4';
const ORIGINAL_POSTER = 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1600';
const DRONE_SOURCE = 'https://videos.pexels.com/video-files/36182314/15344701_1920_1080_25fps.mp4';
const DRONE_POSTER = 'https://images.pexels.com/videos/36182314/aerial-architecture-building-business-36182314.jpeg?auto=compress&dpr=1&h=750&w=1260';
const sha256 = value => createHash('sha256').update(value).digest('hex');

const parts = await Promise.all(FILES.map(path => readFile(path, 'utf8')));
const base64 = parts.join('').replace(/\s+/g, '');
if (base64.length !== EXPECTED_BASE64_LENGTH) throw new Error(`V18 payload length ${base64.length}, expected ${EXPECTED_BASE64_LENGTH}`);
if (sha256(base64) !== EXPECTED_BASE64_SHA256) throw new Error(`V18 payload integrity mismatch: ${sha256(base64)}`);
let html = gunzipSync(Buffer.from(base64, 'base64')).toString('utf8');
if (sha256(html) !== EXPECTED_HTML_SHA256) throw new Error(`V18 HTML integrity mismatch: ${sha256(html)}`);
if (!html.includes(CONTROL_SOURCE)) throw new Error('Canonical proven Pexels control source missing');
if (!html.includes(ORIGINAL_POSTER)) throw new Error('Canonical proven poster missing');
if (!html.includes('id="v18-4-video-controller"')) throw new Error('Canonical proven V18 controller missing');

// Physical-device proof showed the original Pexels delivery plays on iPhone.
// Keep the complete player/controller untouched and swap only to another direct Pexels HD asset.
html = html.replace(CONTROL_SOURCE, DRONE_SOURCE);
html = html.replace(ORIGINAL_POSTER, DRONE_POSTER);

await writeFile('prototype-v18-stable.html', html, 'utf8');
console.log(`V18 stable preview built with proven Pexels player/delivery and drone media: ${DRONE_SOURCE}`);
