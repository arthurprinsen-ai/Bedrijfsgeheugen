# DOM-ready production readback for public language switching — 2026-09-30

Fingerprint: `i18n-production-navigation-readback-20260930-v1`.

Production already proved the exact current source identity and pricing content, but the NL/EN browser verifier timed out because it waited for the full browser `load` event after locale navigation.

The verifier now treats the exact target route plus DOM-ready localized content as the functional boundary. It still fails closed on the wrong pathname, wrong `html[lang]`, Dutch copy on the English route, or visible translation failure.
