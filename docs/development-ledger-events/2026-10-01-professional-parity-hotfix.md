# Professional parity hotfix — 2026-10-01

Build evidence showed `pakketadvies.html` failed the canonical site-UI contract because the bespoke page bypassed shell projection. The hotfix keeps both new tools protected from the legacy V18 rewrite but routes them through the canonical shell and UI normalizer. Netlify deploy-preview subsequently reached a successful build on the recovery branch.

Final promotion remains evidence-gated on the exact candidate SHA and production readback.
