# 2026-09-25 — active v18 mobile language host

Observed:
- production exact-main deployment succeeded;
- production browser verifier opened `#v18MobileDrawer`;
- diagnostic state: `v18Drawer=false`, `v18Selects=0`, `legacySelects=0`, `sharedSelects=0`, `allSelects=0`;
- production snapshot evidence: run `36160448237`.

Root cause:
- `assets/js/i18n.js::mountControl()` omitted `#v18MobileDrawer` from the mobile host list.

Action:
- add the active v18 drawer to the runtime mobile host list;
- retain generic mobile roots and legacy `#bgkopMob`;
- add regression coverage binding runtime host selection to the production verifier;
- require exact-main deployment plus mobile NL/EN roundtrip before terminal closure.

Reconciled protected-main base: `0c1cbba5f9b4966f8270c8138ea5a9e82140d554`. The recovery remains limited to independent i18n asset injection plus the mobile runtime proof.


Deeper production root cause:
- direct public HTML readback of `/prijzen` proved `assets/i18n.css` was present while `assets/js/i18n.js` was absent;
- the shared `data-bg-i18n-asset` marker caused `apply-i18n.mjs` to return before reconciling the missing runtime script;
- zero mobile selectors was therefore a downstream symptom of incomplete asset installation, not only a host-list problem.

Permanent prevention:
- CSS and JS asset presence are checked independently;
- mobile-control injection remains idempotent and always runs after asset reconciliation;
- final public HTML + active mobile NL→EN→NL browser proof are required for terminal closure;
- this prevention is projected into `powerhouse-continuity` and `powerhouse-netlify-production-truth`.
