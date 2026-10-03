# Pricing clean-route terminal writer

The public pricing route is generated as a clean URL. The terminal commercial pricing composer now writes all four artifacts after localized route generation:

- `prijzen.html`
- `prijzen/index.html`
- `en/prijzen.html`
- `en/prijzen/index.html`

Visual regression and production readback now verify the final composed SaaS + consulting surface using the `data-bg-commercial-pricing-v1` marker.
