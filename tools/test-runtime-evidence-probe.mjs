import { readFile } from 'node:fs/promises';

const fail = message => { throw new Error(`Runtime evidence probe regression: ${message}`); };
const source = await readFile('assets/runtime-evidence-probe.js', 'utf8');

if (!source.includes("bg-runtime-probe")) fail('activation query flag missing');
if (!source.includes("window.__BG_RUNTIME_EVIDENCE__")) fail('global evidence contract missing');
if (!source.includes("schemaVersion: 1")) fail('schema version 1 missing');
for (const verdict of ['PENDING', 'PASS', 'FAIL']) if (!source.includes(`'${verdict}'`) && !source.includes(`\"${verdict}\"`)) fail(`verdict ${verdict} missing`);
for (const event of ['loadedmetadata','canplay','playing','pause','waiting','stalled','error','ended']) if (!source.includes(`'${event}'`) && !source.includes(`\"${event}\"`)) fail(`event ${event} missing`);
if (!/80/.test(source) || !/splice\s*\(/.test(source)) fail('bounded 80-event history missing');
if (!/500/.test(source)) fail('500ms sampling interval missing');
if (!/12000|12\s*\*\s*1000/.test(source)) fail('12 second observation timeout missing');
if (!/5(?:\.0)?/.test(source)) fail('5 second advancement threshold missing');

const forbidden = [
  /\bfetch\s*\(/,
  /XMLHttpRequest/,
  /sendBeacon/,
  /new\s+WebSocket/,
  /\.play\s*\(/,
  /\.pause\s*\(/,
  /\b(?:defaultPlaybackRate|playbackRate)\s*=/,
  /\.src\s*=/,
  /\.poster\s*=/,
  /style\.opacity\s*=/
];
for (const re of forbidden) if (re.test(source)) fail(`forbidden behavior present: ${re}`);

console.log('Runtime evidence probe contract PASS');
