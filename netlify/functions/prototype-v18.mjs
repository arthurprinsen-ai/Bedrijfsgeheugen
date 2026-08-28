import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const BRANCH = 'prototype-v18-6';
const BASE = `https://raw.githubusercontent.com/arthurprinsen-ai/Bedrijfsgeheugen/${BRANCH}/v18-full`;
const FILES = [
  'chunk-00.txt','chunk-gap.txt','chunk-01.txt','chunk-02.txt',
  'chunk-03-0.txt','chunk-03-1a.txt','chunk-03-1b.txt','chunk-03-2.txt','chunk-03-3.txt','chunk-03-4.txt','chunk-03-5a0.txt','chunk-03-5a1.txt','chunk-03-5b.txt',
  'chunk-04.txt','chunk-05.txt','chunk-06.txt'
];
const EXPECTED_BASE64_LENGTH = 108484;
const EXPECTED_BASE64_SHA256 = '64c33847585fb3d93e3a4bbe8bfd33aee5221678a047f613f6144330f69e305b';
const EXPECTED_HTML_SHA256 = 'be938e95870994b89773d141a400318a1be3eac4829d69aac6bac48942bd230b';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

const HERO_MOTION = `
<div id="heroBackgroundVideo" class="hero-bg-video v18-motion-hero" aria-hidden="true">
  <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" role="presentation">
    <defs>
      <radialGradient id="v18GlowA" cx="72%" cy="42%" r="60%">
        <stop offset="0%" stop-color="#ffe7a7" stop-opacity=".85"/>
        <stop offset="32%" stop-color="#f5a94e" stop-opacity=".28"/>
        <stop offset="100%" stop-color="#06152f" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="v18GlowB" cx="28%" cy="58%" r="65%">
        <stop offset="0%" stop-color="#77d5ff" stop-opacity=".58"/>
        <stop offset="42%" stop-color="#1c70db" stop-opacity=".22"/>
        <stop offset="100%" stop-color="#06152f" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="v18Line" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#9ce8ff" stop-opacity="0"/>
        <stop offset="45%" stop-color="#ffffff" stop-opacity=".72"/>
        <stop offset="72%" stop-color="#ffd789" stop-opacity=".52"/>
        <stop offset="100%" stop-color="#ffd789" stop-opacity="0"/>
      </linearGradient>
      <filter id="v18Blur"><feGaussianBlur stdDeviation="48"/></filter>
    </defs>
    <rect width="1600" height="900" fill="#06142e"/>
    <circle class="v18-orb v18-orb-a" cx="1120" cy="360" r="520" fill="url(#v18GlowA)" filter="url(#v18Blur)"/>
    <circle class="v18-orb v18-orb-b" cx="430" cy="560" r="590" fill="url(#v18GlowB)" filter="url(#v18Blur)"/>
    <g class="v18-flow v18-flow-one" fill="none" stroke="url(#v18Line)" stroke-width="3">
      <path d="M-120 690 C250 350 530 830 900 490 S1380 210 1750 470"/>
      <path d="M-180 760 C250 440 560 860 980 550 S1420 310 1770 530" opacity=".42"/>
    </g>
    <g class="v18-flow v18-flow-two" fill="none" stroke="#9edfff" stroke-opacity=".28" stroke-width="2">
      <path d="M-100 270 C290 40 560 500 930 250 S1390 30 1710 220"/>
    </g>
    <g class="v18-stars" fill="#fff">
      <circle cx="250" cy="220" r="4"/><circle cx="520" cy="150" r="3"/><circle cx="780" cy="320" r="4"/>
      <circle cx="1050" cy="160" r="3"/><circle cx="1310" cy="520" r="4"/><circle cx="1440" cy="260" r="3"/>
    </g>
  </svg>
</div>`;

const MOTION_FIX = `
<style id="v18-hero-motion-fix">
.hero-video{background:#06142e;overflow:hidden}
.v18-motion-hero{display:block!important;opacity:1!important;visibility:visible!important;width:100%!important;height:100%!important;position:absolute!important;inset:0!important;background:#06142e;overflow:hidden}
.v18-motion-hero svg{width:100%;height:100%;display:block;transform:scale(1.08);animation:v18Drift 14s ease-in-out infinite alternate}
.v18-orb-a{transform-origin:70% 42%;animation:v18OrbA 8s ease-in-out infinite alternate}
.v18-orb-b{transform-origin:28% 58%;animation:v18OrbB 10s ease-in-out infinite alternate}
.v18-flow-one{animation:v18FlowOne 11s ease-in-out infinite alternate}
.v18-flow-two{animation:v18FlowTwo 13s ease-in-out infinite alternate}
.v18-stars circle{animation:v18Pulse 4.8s ease-in-out infinite alternate}.v18-stars circle:nth-child(2n){animation-delay:-1.6s}.v18-stars circle:nth-child(3n){animation-delay:-3s}
@keyframes v18Drift{from{transform:scale(1.08) translate3d(-1.5%,0,0)}to{transform:scale(1.14) translate3d(1.5%,-1%,0)}}
@keyframes v18OrbA{from{transform:translate3d(-45px,28px,0) scale(.94);opacity:.72}to{transform:translate3d(55px,-34px,0) scale(1.08);opacity:1}}
@keyframes v18OrbB{from{transform:translate3d(45px,-20px,0) scale(1.06);opacity:.58}to{transform:translate3d(-60px,35px,0) scale(.92);opacity:.9}}
@keyframes v18FlowOne{from{transform:translate3d(-55px,18px,0);opacity:.45}to{transform:translate3d(60px,-24px,0);opacity:.9}}
@keyframes v18FlowTwo{from{transform:translate3d(35px,-12px,0);opacity:.25}to{transform:translate3d(-45px,20px,0);opacity:.65}}
@keyframes v18Pulse{from{opacity:.18;transform:scale(.65)}to{opacity:.92;transform:scale(1.45)}}
@media(prefers-reduced-motion:reduce){.v18-motion-hero svg,.v18-motion-hero *{animation-duration:40s!important}}
</style>`;

export const handler = async () => {
  try {
    const parts = await Promise.all(FILES.map(async (file) => {
      const response = await fetch(`${BASE}/${file}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`${file} HTTP ${response.status}`);
      return response.text();
    }));

    const base64 = parts.join('').replace(/\s+/g, '');
    if (base64.length !== EXPECTED_BASE64_LENGTH) {
      throw new Error(`payload length ${base64.length}, expected ${EXPECTED_BASE64_LENGTH}`);
    }
    const payloadHash = sha256(base64);
    if (payloadHash !== EXPECTED_BASE64_SHA256) {
      throw new Error(`payload integrity mismatch ${payloadHash}`);
    }

    let html = gunzipSync(Buffer.from(base64, 'base64')).toString('utf8');
    const htmlHash = sha256(html);
    if (htmlHash !== EXPECTED_HTML_SHA256) {
      throw new Error(`html integrity mismatch ${htmlHash}`);
    }
    if (!html.includes('id="view-home"') || !html.includes('id="view-product"')) {
      throw new Error('prototype validation failed');
    }

    html = html.replace(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/, HERO_MOTION);
    html = html.replace(/<script id="v18-4-video-controller">[\s\S]*?<\/script>\s*/, '');
    html = html.replace(/<style id="v18-10-video-fix">[\s\S]*?<\/style>\s*<script id="v18-10-video-controller">[\s\S]*?<\/script>\s*/, '');
    if (!html.includes('id="v18-hero-motion-fix"')) html = html.replace('</head>', `${MOTION_FIX}\n</head>`);
    html = html.replace('<head>', '<head><base href="/">');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'X-Robots-Tag': 'noindex, nofollow',
        'X-Prototype-Version': 'v18-inspirational-motion-v2'
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
