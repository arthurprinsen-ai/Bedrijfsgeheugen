# SaaS checkout final-artifact recovery
Obligation-ID: saas-customer-loop-20261021-v1
Root cause: source checkout runtime and DOM targets were removed by shell/build projection.
Evidence: production release 3821930 returned checkout HTML without payment creation/completion runtime; regression reproduced loss through applyCanonicalShell.
Fix: canonical source capture/restore, explicit page-runtime preservation, stable H1, final NL/EN target/runtime guard, safe POST fallback.
Regression: tests/brain-saas-checkout-build-preservation-v1.test.mjs executes real shell projection and payment-state runtime.
Prevention: validate the final website artifact rather than inferring interaction from source or generic build success.
Outcome: recovery candidate; no paid-customer acceptance fabricated.
