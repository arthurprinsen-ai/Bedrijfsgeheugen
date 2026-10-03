# Netlify production transport timing

The production delivery workflow now gives the native Git-linked Netlify deploy a longer bounded observation window before activating the exact-source fallback transport. Exact commit identity and production readback remain mandatory.
