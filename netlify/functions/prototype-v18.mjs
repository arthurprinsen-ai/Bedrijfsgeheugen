import { gunzipSync } from 'node:zlib';

const BRANCH = 'prototype-v18-6';
const BASE = `https://raw.githubusercontent.com/arthurprinsen-ai/Bedrijfsgeheugen/${BRANCH}/v18-full`;

export const handler = async () => {
  try {
    const urls = Array.from({ length: 7 }, (_, i) => `${BASE}/chunk-${String(i).padStart(2, '0')}.txt`);
    const parts = await Promise.all(urls.map(async (url) => {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`${url} HTTP ${response.status}`);
      return response.text();
    }));

    const base64 = parts.join('').replace(/\s+/g, '');
    let html = gunzipSync(Buffer.from(base64, 'base64')).toString('utf8');
    html = html.replace('<head>', '<head><base href="/">');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'X-Robots-Tag': 'noindex, nofollow'
      },
      body: html
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      body: `Prototype kon niet laden: ${error?.message || error}`
    };
  }
};
