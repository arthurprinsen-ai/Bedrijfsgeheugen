# LinkedIn cockpit autopilot v1

De LinkedIn-cockpit wordt niet langer behandeld als een scherm dat dagelijks handmatig bediend moet worden. De bestaande Powerhouse social publisher consumeert nu ook geschikte cockpitacties.

## Wat automatisch gaat
Een evidence-backed reactie op een concrete LinkedIn-post kan automatisch worden opgepakt wanneer de actie nog `suggested` is, een directe LinkedIn-postbron heeft en er definitieve tekst beschikbaar is. De actie wordt eerst atomair geclaimd, vervolgens via de bestaande Composio LinkedIn-verbinding uitgevoerd en daarna met providerbewijs en outcome teruggeschreven.

## Wat bewust niet wordt geforceerd
LinkedIn-DM's en connectie-activatie worden niet nagemaakt via scraping, browsertrucs of een niet-bestaande provideractie. Als de gekoppelde LinkedIn/Composio-capability die handeling niet ondersteunt, blijft de cockpit dat item tonen als capability-exception.

## Waarom deze wijziging
De eerdere architectuur kon signaleren, prioriteren en concepten genereren, maar koppelde dat niet door naar uitvoering. Daardoor bleef menselijke bediening noodzakelijk. De structurele oplossing is om uitvoering aan de canonieke publisher toe te voegen, met dezelfde idempotency-, evidence- en outcome-regels.

## Borging
De wijziging heeft contracttests in de bestaande LinkedIn Revenue Cockpit-suite. De gebruikte outcome-RPC staat in het quality-surface-register. De delivery-classifier herkent de cockpittests. LIVE_PROVEN mag pas worden gebruikt na merge naar `main`, deployment van de Supabase function en geauthenticeerde runtime-readback.
