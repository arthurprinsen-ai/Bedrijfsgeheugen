# Production English routes fail closed

## Root cause
The NL/EN selector and routing were functioning, but production could still generate Dutch content under `/en/*`. The localized-route builder intentionally returned no translations when the static cache was incomplete and `STATIC_I18N_NETWORK=0`.

## Repair
Production enables static English translation. The existing builder already treats provider failures as terminal when network translation is enabled. Deploy previews remain offline/provider-independent.

## Terminal contract
A release is not LIVE until exact-main production identity is proven and browser readback completes NL→EN→NL on:
- `/`
- `/prijzen`
- `/systemen-koppelen`

The English pricing route must not contain the Dutch pricing H1.
