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

## Revision 3

- Exact production SHA: `c2bf6d4f059307579686f1b61d66f195b0ee2af7`.
- Netlify deploy: `6ab69d42a66ec50008a2947c`, ready, exact commit match.
- Snapshot run: `36159192559`.
- Provider build/content/identity: green.
- Browser failure: `visible mobile language select is missing after opening mobile navigation`.
- Root cause: hidden shared language select was preferred by `count()` before the visible legacy/compact select.
- Repair: visibility-first mobile selector across approved mobile hosts; same logic NL→EN and EN→NL.
- Regression: presence-first shared/legacy ternaries are forbidden.

