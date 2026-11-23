# 2026-11-02 — original BRAIN 3-source-guard regression ledger

- Obligation: powerhouse-postmerge-content-guard-contracts-20261102-v1
- Parent security recovery: PR #5309 source parity of 791 applied migrations is independently verified; do not reapply SQL.
- Independent BRAIN provider run: 41462543890, backend job 125335501824. Total reported failures **3**; tests #951, #4140 and #4418. No migrated lock errors remain in this run.
- Cause: three historical tests required precise pre-regeneration code strings. Protected PR #5305 extended original content loop with company source rotation under no-provider-side-effect + not-consumed authority gates.
- Fix: update *existing* BRAIN tests to assert safe and bounded branch semantics; no runtime code change or false green.
- Close only after original Required/BRAIN/CodeQL, exclusive writer protected merge, post-merge run. Do not falsely mark daily content or total security posture verified.
