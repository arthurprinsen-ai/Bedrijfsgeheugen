# Website cross-browser assurance stabilization — 2026-10-04

Obligation: `website-cross-browser-assurance-20261004-v1`

The browser assurance runner was hardened after production evidence showed two false-positive classes: transient execution-context replacement during canonical/i18n navigation, and browser-specific abort codes for cancelled requests. The fix retries inspection on the final document and ignores only known benign abort signatures. All real rendering, image, CLS, overflow, HTTP and non-benign core-request failures remain fail-closed.
