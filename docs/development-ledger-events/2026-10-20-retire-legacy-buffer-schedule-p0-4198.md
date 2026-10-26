# 2026-10-20 — legacy Buffer scheduler retirement

Parent-P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Related: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Obligation-ID: commercial|legacy-buffer-cron-retirement|20261020
Delivery-Lane: automation
Candidate-Type: recovery
Base-SHA: c8c564306ecac0cf7f7294f9fd6761b1510c8abf
Scope-Budget: 5

Evidence: Netlify function HTTP503 from BUFFER_HTTP_401 around 2026-10-20 12:15Z on a legacy scheduled collector. This is not canonical social delivery. Proposed action removes solely `config.schedule`; keeps direct-call diagnostics and all canonical executors active. No new outbound message, credential bypass, queue or alternate provider. CI/CodeQL, Netlify deploy and postdeploy absence of new scheduled runs are PENDING. Existing #4198 and #4215 remain open until actual provider and portal acceptance.
