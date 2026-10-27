# Unified SaaS, consulting and portal packaging — 1 October 2026

Bedrijfsgeheugen now uses one commercial model across public pricing, checkout and Portal V2.

## SaaS
- Starter — €99/month
- Pro — €299/month
- Groei — €749/month
- Enterprise — custom

The core product remains Powerhouse Intelligence + Agents + Connect. Higher tiers increase users, integrations, document capacity, AI usage, refresh rate, automation and governance.

## Consulting & workshops
- Frisse Blik — €0 / 30 minutes
- Directie & AI Workshop — €1,950 one-off, includes 30 days Pro access
- Bedrijfsgeheugen Scan — €2,950 one-off, includes 30 days Groei access
- Build Sprint — from €14,500, includes 60 days Pro access
- Transformation / Fractional Lead — from €2,950/month, includes Pro access while in scope

The paid value of a workshop or scan can be credited toward a Build Sprint started within 30 days.

## Runtime parity
Portal V2 fetches `/api/portal-entitlements`, shows the active plan, marks unavailable modules as upgrades and blocks direct navigation to plan-gated modules. Checkout uses the same SaaS plan codes stored in the existing server-side SaaS tables.
