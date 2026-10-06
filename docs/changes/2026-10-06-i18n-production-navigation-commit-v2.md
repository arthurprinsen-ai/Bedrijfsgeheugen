# I18n production navigation readback — navigation commit proof

Date: 2026-10-06

The exact production deployment `2fa5fa60f248a5f14d86426cb835c447ab291cd3` was live and the canonical pricing contract was proven, but Production Source Snapshot failed while switching locale. The verifier polled `document.documentElement.lang` during a real navigation and could evaluate against the transient replacement document before `documentElement` existed.

The verifier now separates route proof from semantic locale proof:

1. find and use the real visible language control;
2. start an exact-path `page.waitForURL(..., { waitUntil: 'commit' })` before the click/select;
3. require the new body to become visible;
4. require `html[lang]` to equal the selected locale;
5. require localized content and reject visible translation failure;
6. preserve the NL → EN → NL roundtrip and reject deprecated `/nl/*` leakage.

This removes the lifecycle race without weakening production proof.
