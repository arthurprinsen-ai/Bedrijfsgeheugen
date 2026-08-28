import { gunzipSync } from 'node:zlib';

const BRANCH = 'prototype-v18-6';
const BASE = `https://raw.githubusercontent.com/arthurprinsen-ai/Bedrijfsgeheugen/${BRANCH}/v18-full`;
const FILES = ['chunk-00.txt','chunk-01.txt','chunk-02.txt','chunk-03.txt','chunk-04.txt','chunk-05.txt','chunk-06.txt'];

export const handler = async () => {
  try {
    const parts = await Promise.all(FILES.map(async (file) => {
      const response = await fetch(`${BASE}/${file}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`${file} HTTP ${response.status}`);
      return response.text();
    }));
    const base64 = parts.join('').replace(/\s+/g, '');
    if (base64.length !== 108484) throw new Error(`payload length ${base64.length}, expected 108484`);
    let html = gunzipSync(Buffer.from(base64, 'base64')).toString('utf8');
    if (!html.includes('id="view-home"') || !html.includes('id="view-product"')) throw new Error('prototype validation failed');
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
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store'
      },
      body: `Prototype kon niet laden: ${error?.message || error}`
    };
  }
};
