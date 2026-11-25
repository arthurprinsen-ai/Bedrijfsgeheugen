# Canonical daily blog redirect reconciliation

- Event date: 2026-10-09; parent P0: #4198
- Source-backed live candidate: blog:sopv-2026-plasticverwerkers-productietest-subsidie
- Production verification: Supabase pg_net #1570 HTTP 200 + canonical/content-id/title all true; Netlify deploy 6ac8c38172d5dd0008a6169a commit 47441ea9ed428202a7f1ccca5dc8cd5038d544bb ready
- Obsolete selected candidate: onprijsd-probleem-bedrijfsvoering; forced 301 to an older article, documented failure GitHub watchdog #37918931429
- Changes: ledger's date-keyed selection, existing regression test, compact incident learning and change documentation
- No parallel writer, no direct-to-main write, no altered SEO redirect, no fake live flag; native watchdog must commit final immutable LIVE proof
