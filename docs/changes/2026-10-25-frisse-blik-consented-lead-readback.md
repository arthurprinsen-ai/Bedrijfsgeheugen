# Frisse Blik — aantoonbare vrijwillige leadregistratie
- Aanleiding: 39 bestaande onherleidbare scans; geen contact-/marketingtoestemming. Deze 39 blijven anoniem.
- Hergebruik #4882: de bestaande vrijwillige CTA, consent-modal en Calendly-route blijven behouden.
- Voegt een first-party Netlify intake toe die de bestaande private Supabase-tabel `commercial_leads` gebruikt. Geen nieuwe database/CRM/scheduler.
- Expliciete afzonderlijke toggles: verplichte, doelgebonden toestemming voor scanopvolging; optionele marketingtoestemming standaard uit.
- Alleen bij server-ACK **én onafhankelijke DB-readback** wordt de bezoeker naar Calendly geleid. Misstappen blijven zichtbaar; geen stilzwijgende fallbacks.
- Bestaande anonieme scans blijven ongewijzigd; geen ongevraagde outreach.
- Attributie koppelt de bestaande tabbladsessie en herkomst aan het leadrecord, plus `utm_content` van Calendly. Afspraakbewijs blijft onafhankelijk van provider vereist.
- Geen omzet-/afspraakclaims in deze PR. Productie moet exact-SHA checks, beschermde merge en een vrijwillige echte submission + DB-readback bewijzen.
