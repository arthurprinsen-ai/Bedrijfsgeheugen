# 2026-09-25 — Mobile i18n visible-control wait v2

- Obligation: `mobile-i18n-visible-control-wait-20260925-v2`
- Lane: website
- Candidate type: recovery
- Production SHA before fix: `6417fa291ac08345369e1e143abf974fac54f0e4`
- Netlify deploy: `6ab698be9627e6c36975bed1`
- Production/source equality: proven
- Browser failure: `visible mobile language select is missing`

Root cause:
- mobile language control is dynamically mounted by `assets/js/i18n.js`;
- browser verifier used an immediate count assertion after opening the mobile drawer.

Action:
- wait for `[data-bg-language-select]:visible` before NL→EN interaction;
- wait again after English navigation before EN→NL interaction;
- keep all functional locale assertions intact.

Terminal closure requires protected merge, exact-main production promotion where applicable, and a green pricing/i18n browser proof.
