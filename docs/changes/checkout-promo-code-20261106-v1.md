# Actiecode uit het AI-kloof-rapport wordt bij de 30-dagen-proef bewaard

Datum: 6 november 2026
Obligation: `checkout-promo-code:ai-kloof-2026q4`

Het rapport "De AI-kloof in het mkb" (editie 2026-Q4) geeft de code KLOOF-Q4 weg voor de bestaande proefperiode van 30 dagen. Wie de link of QR-code uit het rapport opent, ziet op /afsluiten "Code KLOOF-Q4: 30 dagen gratis, geen betaalmethode nodig". De code reist mee naar de proefaccount en staat daarna in de metadata van de proef, zodat zichtbaar is hoeveel proefaccounts uit het rapport komen.

Wat niet verandert: de proef zelf (geen betaalmethode, één per e-mailadres), de prijzen, het schema. De code geeft geen korting; hij meet herkomst.

Na de merge moet de edge function bg-mollie-checkout opnieuw worden gedeployed, anders komt de code niet in de metadata.
