# P0 #4215 — EU 2026 CSRD/ESRS source version and customer impact

## Observed gap
The existing regulatory-context-trace projects tenant regulatory events to affected pages but did not carry a separately identified, versioned official EU CSRD/ESRS legal source gate. A regulatory signal alone is not proof of customer applicability, compliance, or quantified impact.

## Scope-limited correction
- Add immutable EUR-Lex identifiers: Directive (EU) 2026/470 and Delegated Regulation (EU) 2026/1563.
- Screen the **conjunctive** >1,000 average employees and >EUR 450m turnover rule only for financial years beginning **2027 or later**. A 2026 year does not inherit 2027 screening rules.
- Return REVIEW_REQUIRED for every legal outcome; missing entity/group fiscal-year national implementation, legal assessment and ESRS materiality remain explicit.
- Add the legal reference to the existing regulatory context trace; CSRD changes already affect sustainability, source library, finance, due diligence, roadmap and advice through the existing page dependency graph.
- No new Brain/runtime/database writes, no fabricated legal conclusion or demo customer session.

## Official authority
- https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32026L0470
- https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32026R1563

## Verification and boundaries
Run `node --test tests/brain-p0-4215-csrd-official-legal-source-v1.test.mjs portal-v2/tests/regulatory-context-trace.test.mjs`. Protected exact-head CI, successful merge and Netlify readback are deployment gates, not independent authenticated customer/tenant readback. Parent P0 #4215 still needs field-level audit, two authorized customers, durable outbox split/ACK stress tests and individual legal assessment.
