# Mobile NL/EN browser readback wait — 25 September 2026

## Incident

Netlify production was already serving the exact protected `main` SHA `6417fa291ac08345369e1e143abf974fac54f0e4`, but the terminal pricing/i18n browser proof failed with:

`visible mobile language select is missing`

## Root cause

The mobile language select is not static markup in the canonical header. It is mounted by `assets/js/i18n.js` into the mobile drawer. The production verifier opened the drawer and immediately tested locator count, so the assertion could execute before the dynamically mounted control became visible.

## Fix

The verifier now waits up to five seconds for the visible mobile language select before selecting English, and applies the same wait on the English-to-Dutch return path.

The actual functional proof remains unchanged: the gate still requires `/prijzen` → `/en/prijzen` → `/prijzen`, correct `html lang`, visible English pricing content, and no runtime language-switch failure.

## Prevention

Dynamic UI is verified as asynchronous state. Presence-only checks and hidden desktop fallbacks are not accepted as proof for the mobile viewport.
