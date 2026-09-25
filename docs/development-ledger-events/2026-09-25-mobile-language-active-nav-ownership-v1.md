# 2026-09-25 — Mobile language control active-nav ownership

Observed:
- production source identity, deploy and pricing content proofs were green;
- browser interaction proof failed with `visible mobile language select is missing`;
- the page retained legacy `#bgkopMob`, while `menu.js` rendered visible `#bgSharedMobileNav`.

Root cause:
- split DOM ownership between the i18n control and the shared mobile navigation.

Repair:
- move/preserve the mobile language control into the active shared root;
- remount i18n controls on the shared-nav-ready event;
- keep mobile language injection idempotent even when i18n assets already exist;
- retain production NL→EN→NL browser proof as terminal gate.
