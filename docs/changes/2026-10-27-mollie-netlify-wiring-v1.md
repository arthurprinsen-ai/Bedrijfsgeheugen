# Mollie wiring in Netlify

checkout-create validates plan, price and catalogue, stores the intent and delegates customer, first payment and recurring subscription to bg-mollie-checkout. checkout-readiness reports edge readiness and polls payment status by intent id. afsluiten.html names Mollie. stripe-webhook.mjs stays in the repository unused (no secrets configured) and is removed in a follow-up.
