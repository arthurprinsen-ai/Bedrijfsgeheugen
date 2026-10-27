# 2026-10-02 — Approved blog index marker recovery

- Obligation: Powerhouse end-to-end publication recovery.
- Observed failure: approved-central-blog run 37026137254 stopped with `Blogindex mist artikelen-marker`.
- Root cause: `blog/index.html` had a literal `\\n` after `<div class="artikelen">`, while the deterministic publisher accepted only a real newline.
- Repair: normalize the current index marker and make the publisher backwards-compatible with both representations.
- Safety: no publication side effect is claimed by this change; protected GitHub delivery, Netlify and public readback remain mandatory.
- Regression: rerun the exact approved blog obligation after this change reaches main.
