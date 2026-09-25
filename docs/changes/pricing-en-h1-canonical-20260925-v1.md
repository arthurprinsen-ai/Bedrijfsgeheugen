# Canonical English pricing H1 — 25 September 2026

Production exact-SHA deployment and all structural pricing checks were green, but the final browser readback proved that `/en/prijzen` still rendered the Dutch H1 `Prijzen voor digitalisering in het mkb`.

The static English cache now has a canonical patch mapping that source string to `Pricing for digitalization in SMEs`.

The existing production browser proof remains fail-closed and continues to reject the Dutch H1 on the English route.
