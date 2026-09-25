# Static English pricing H1 recovery — 25 September 2026

Production was already serving the exact protected `main` commit, and NL→EN navigation reached `/en/prijzen`. The remaining terminal failure was content-level: the page still showed the Dutch H1 `Prijzen voor digitalisering in het mkb`.

The static locale generator reads the immutable English cache plus ordered JSON patches from `config/bg-static-i18n-en.d`. A targeted override now maps that Dutch source heading to `Pricing for SME digitalisation`.

This preserves the offline/fail-closed localization model and avoids weakening production build guarantees. The production browser gate remains authoritative: the English route must not contain the Dutch H1 and must expose visible English pricing copy.
