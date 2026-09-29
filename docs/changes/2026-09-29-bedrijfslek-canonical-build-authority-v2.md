# Bedrijfslek blijft nu eigenaar van /zelfscan

De oorzaak van de terugval naar de oude zelfscan zat niet meer in de routeconfiguratie maar in de buildvolgorde. De bronpagina op `main` was correct; tijdens de Netlify-build werd hij later vervangen door oudere gegenereerde inhoud.

De build krijgt daarom een expliciete integriteitsgrens. De canonieke 12-vragen Bedrijfslek wordt vóór legacy builders vastgezet en daarna teruggezet, waarna de normale sitebrede shell en taalroutes worden toegepast.

De regressietest controleert vanaf nu expliciet:
- 12 vragen / Bedrijfslek-copy aanwezig;
- geen verplichte e-mail- of formuliermuur;
- drie concrete acties aanwezig;
- portaal/order-route aanwezig;
- de tekst `Beantwoord zes vragen` mag niet in het uiteindelijke artifact voorkomen.

Een deploy-SHA alleen geldt niet als functionele productie-evidence; de publieke route moet inhoudelijk worden teruggelezen.
