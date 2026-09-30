# Terminal Live Handoff + Netlify Feedback v1

Voortaan is de canonieke afronding voor website-delivery:

**MAIN → NETLIFY PRODUCTION → WEBSITE READBACK → LIVE → BORGING**

- **MAIN**: de wijziging staat op protected main.
- **NETLIFY PRODUCTION**: Netlify bevestigt de productieversie.
- **WEBSITE READBACK**: de echte productie-URL is functioneel groen.
- **LIVE**: de gevraagde functionaliteit werkt aantoonbaar voor de bezoeker.
- **BORGING**: skills, agents/chats, Powerhouse Brain learning, ledger, documentatie en Systeemkaart/control surfaces zijn bijgewerkt en teruggelezen.

Een herhaalde opdracht "zet live" begint altijd met productie-reconciliatie. Is het gewenste gedrag al bewezen live, dan wordt geen nieuwe implementatie, vervangende PR of dubbele deploy gestart. Alleen ontbrekende post-live borging wordt afgerond als `BORGING_PENDING`.

De terminale terugkoppeling gebruikt expliciet:
`MAIN ✓ | NETLIFY PRODUCTION ✓ | WEBSITE READBACK ✓ | LIVE ✓ | BORGING ✓`.
