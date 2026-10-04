# Website cross-browser real-defect recovery — 2026-10-04

Fresh exact-preview evidence from run `37205893123` exposed three remaining defect classes:

- the preview sweep could start from a production sitemap before the candidate sitemap/generated routes were ready;
- browser interactions targeted legacy V18 selectors even when the canonical shared header was active;
- tablet layout on AI Modelwijzer still shifted after first paint because the trustbar outer geometry was not fully reserved.

The recovery makes exact candidate route readiness mandatory, supports both canonical shared-header and legacy V18 controls, corrects the mobile button `aria-controls`, and reserves the final tablet trustbar height before runtime. The visual thresholds are unchanged.
