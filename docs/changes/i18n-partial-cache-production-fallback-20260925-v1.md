# Partial-cache English production fallback

## Root cause
The static English builder treated the translation corpus as all-or-nothing. In an offline release, one uncached source string made `translateAll()` return `null`. The builder then generated every `/en/*` route from Dutch source, even for strings whose English translation was already present in the versioned cache.

This was observed on production SHA `9e630bd6360698a829751b9ba8ba4daf2273b595`: exact Netlify identity and pricing content were proven, but `/en/prijzen` still displayed the Dutch H1.

## Fix
Offline builds now retain a partial translation state. Every cached English string is applied statically. Only missing strings are left for the existing runtime fallback. Partial English routes remain explicitly marked as not fully statically translated so the runtime can complete the remainder.

## Invariant
A cache miss on route A may never erase known-good cached English on route B.
