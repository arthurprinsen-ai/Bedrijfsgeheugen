# Original Portal V2 real-value source readback and sparse external non-erasure
- Date 2026-11-12; owner original Portal V2/ONE BRAIN field-to-output P0 #4215.
- Root cause: #5671 HEAD authenticated but not actual field-equivalent; project-state merges generated [] when no provider collection key exists.
- Distinction: source provider absent != explicitly empty; zero != missing; HTTP stored ACK != actual durable same-field GET.
- Fix: same original write owner, nested exact authored portal fields, provider sparse array overlays and full preservation of other original portal values.
- Machine historical/shadow/canary tests: tests/brain-portal-field-value-and-sparse-project-20261112.test.mjs; existing Portal BusinessInput and customer project tests.
- Rejected overlapping old #5670, retained protected #5671 strict stale===false and original source/tenant ACL.
- Stage FIX_CANDIDATE, requires independently verified exact production deploy and real authorized form roundtrip; no claim entire portal/external provider/CRO green.
