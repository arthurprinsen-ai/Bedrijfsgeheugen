# Website cross-browser visual quality closure

The existing website cross-browser assurance is the canonical website visual quality gate.

It checks responsive edge widths, Chromium/Firefox/WebKit critical screenshots, horizontal overflow, broken media, CLS, oversized or clipped media/cards, truncated primary controls, navigation covering the main heading, and critical navigation/language interactions.

Failures must be repaired in the website. Threshold widening is not an accepted structural fix. Screenshot and JSON evidence is retained by the scheduled GitHub workflow.
