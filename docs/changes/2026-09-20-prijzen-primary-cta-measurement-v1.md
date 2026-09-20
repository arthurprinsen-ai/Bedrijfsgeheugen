# Prijzen primary CTA measurement

Fingerprint: `prijzen-primary-cta-measurement-v1`.

The production SEO order readback correctly failed because the native prices page had a visible Frisse Blik CTA but no canonical conversion marker. The CTA now uses the registry URL and declares `data-bg-conversion="frisse-blik"`, page role `money` and funnel stage `decide`.
