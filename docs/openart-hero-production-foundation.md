# OpenArt hero production foundation

Status: promotion candidate

Accepted media identity:
- source SHA-256: `d4a516304adebbf8067bceb034046ddd65e3ff62fd8e34c800115aeb226c89e0`
- derivative SHA-256: `a261792e9b0058802ab5b30ce107c7ac14e8b2291a3bd7ee78fdb5968bbe97fd`
- derivative profile: 1920x1080, CFR 30 fps, H.264, yuv420p, no audio, MP4 faststart
- physical iPhone/Safari runtime acceptance: PASS on 2026-08-28

Production rule:
1. fetch only the pinned source URL;
2. reject when source hash drifts;
3. normalize with the pinned ffmpeg/ffprobe toolchain;
4. reject unless the derivative hash equals the physical-iPhone-tested hash;
5. reject unless the exact media profile passes;
6. only then allow the normal Netlify build to continue.

This foundation does not change the current homepage or enable the V18 prototype. It only makes the accepted hero media reproducibly available as a generated deployment asset at `/assets/openart-hero-iphone-safe-v1.mp4` for a subsequent, separately gated homepage integration.
