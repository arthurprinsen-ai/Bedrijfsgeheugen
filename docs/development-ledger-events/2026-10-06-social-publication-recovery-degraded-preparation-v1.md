# Social publication recovery degraded preparation

Date: 2026-10-06  
Obligation: social-publication-recovery-degraded-preparation-20261006

Observed:
- the canonical full content loop timed out after 120 seconds during same-day recovery;
- the workflow stopped at that preparation failure and skipped the bounded `publish_only` channel invocations;
- LinkedIn personal and LinkedIn company were already `content_ready`, so skipping the publisher prevented a legitimate resumable delivery attempt;
- sanitized evidence was created under `.artifacts`, but the upload action reported no files because the directory was hidden.

Implemented:
- capture content-loop curl failure as degraded preparation evidence instead of terminating the job;
- run bounded canonical publishers with `if: always()`;
- preserve one-writer authority: only `powerhouse-social-publisher` can perform provider side effects;
- keep final canonical state readback fail-closed;
- persist evidence under `recovery-artifacts/`.

Terminal condition:
required same-day publication decisions are provider-backed `published` or `scheduled`, with the normal canonical readback evidence. A degraded preparation result alone is never terminal green.
