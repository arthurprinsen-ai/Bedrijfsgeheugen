# /afsluiten werkt met Mollie (maand en jaar)

- `/afsluiten` → `/api/checkout/create` → Supabase `bg-mollie-checkout` → Mollie-checkout; terugkerend maandelijks of jaarlijks (jaar = tien maandbedragen).
- Besluiten (Arthur: "beslis zelf adv SaaS-voorbeelden"): geen proefperiode in de checkout (gratis instap is Frisse Blik; maandelijks opzegbaar); Control, Scale en Enterprise niet direct afsluitbaar; alle prijzen excl. btw.
- `/prijzen` toont betaalperiode-schakelaar, uitleg wat Mollie int, en correcte og/twitter-tags.
- Stripe-betaalroute vervangen; `stripe-webhook.mjs` blijft voorlopig inert (verwijderen in vervolg-PR samen met System Map).
