# Pricing responsive controls + static English — 2026-09-23

## Problem

On the live pricing page, the route, package and monthly/yearly controls could be visible yet still fail when tapped, especially after another runtime script replaced DOM nodes. English could also navigate successfully but remain untranslated because production relied on a browser-time translation fallback.

## Root cause

The interaction rescue code delegated events, but its initial state repair only ran on one document-loading path and it did not observe later DOM replacement. The localization build also had `STATIC_I18N_NETWORK = "0"` globally, so production did not guarantee that `/en/...` contained static English at release time.

## Fix

The pricing controller now handles click, touchend and keyboard activation in capture phase, initializes immediately when the document is already loaded, and uses a MutationObserver to re-synchronize state after DOM replacement. The mobile asset version is bumped so the corrected controller is fetched.

Production now builds static English content with `STATIC_I18N_NETWORK = "1"`. Deploy previews explicitly override that to `0` to keep preview builds deterministic and independent of translation-provider availability.

## Prevention and evidence

Regression coverage locks both the interaction self-repair behavior and the production/preview localization contract. A candidate is not considered closed until the exact head passes CI and preview, merges to main, reaches the current Netlify production deploy, and both `/prijzen` and `/en/prijzen` are read back successfully.
