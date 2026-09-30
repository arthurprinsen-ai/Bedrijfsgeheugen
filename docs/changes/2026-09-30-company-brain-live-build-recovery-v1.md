# Company Brain live build recovery

**Date:** 2026-09-30  
**Fingerprint:** `production|company-brain-netlify-build-recovery|v1`

The first production promotion reached Netlify but both linked and exact-source builds failed. The public-page CI additionally exposed a Company Brain page shell/runtime conflict, insufficient internal linking and prohibited wording.

Recovery:
- remove the page-specific header so the canonical site shell remains the only navigation owner;
- complete the static English translation cache for the new category literal and recovery copy;
- replace “waardevol” on the page;
- add contextual links from `/bedrijfsgeheugen` and `/ai-ecosysteem`, which together with the homepage bridge gives the category pillar at least three inbound routes.

Terminal acceptance remains Netlify production + public readback.
