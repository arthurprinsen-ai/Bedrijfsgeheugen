# Daily blog: skip the ffmpeg-static postinstall — 2026-11-08

## Problem
The two `npm install` steps of `powerhouse-daily-blog.yml` still ran the root `ffmpeg-static` postinstall, which downloads a binary from GitHub releases (persistent HTTP 504 on 8 Nov). The blog build never runs that binary.

## Change
- `.github/workflows/powerhouse-daily-blog.yml`: both installs use `--ignore-scripts`.
- `tests/brain-required-test-npm-install-20261108.test.mjs`: pins every `npm install` line of that workflow.

## Not changed
No test weakened, no setting touched.

## Known limit
Not proven until the blog run of 9 Nov merges without handwork.
