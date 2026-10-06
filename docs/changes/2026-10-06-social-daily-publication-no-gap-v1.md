# Daily social publication self-heal gap

## Probleem

De dagelijkse social-contentlijn had twee opeenvolgende recovery-gaps.

Eerst bleek de aanvullende Netlify supervisor slechts eenmaal per uur te retryen. Dat is in #3823 teruggebracht naar elke tien minuten en gekoppeld aan production deploy.

Daarna bleek de diepere fout: die supervisor riep alleen `powerhouse-social-publisher` aan. De publisher kan uitsluitend bestaande `content_ready` decisions met artifacts dispatchen. Als juist generatie/orchestratie was gemist, kon de recovery dus gezond draaien zonder ooit nieuwe content te maken.

## Oplossing

De recovery supervisor start voortaan eerst de bestaande canonieke `powerhouse-content-loop`.

Die ene loop bezit al de end-to-end volgorde:

1. outcome reconciliation;
2. dagelijkse Instagram winner/media preparation;
3. provider capability preflight;
4. content generation/orchestration;
5. canonieke social publisher;
6. blog queue;
7. provider/readback reconciliation.

Daarna leest de Netlify supervisor pas de verse `delivery_context` en provider-state terug.

Er wordt geen tweede provider writer toegevoegd. `powerhouse-content-loop` blijft de bestaande owner en roept zelf de canonieke publisher aan.

## Borging

De social-publication authority-test controleert nu expliciet:

- de tienminuten-cadans;
- recovery via `powerhouse-content-loop`, niet rechtstreeks via een alternatieve provider writer;
- volgorde `content-loop -> fresh delivery_context -> provider readback`;
- delegatie van de production-deploy hook naar dezelfde recoveryfunctie;
- afwezigheid van directe provider-write primitives in de deploy-hook;
- behoud van het lokale publicatievenster.

## Bewijsgrens

Deze follow-up is pas LIVE_PROVEN na protected merge, production deploy en provider-readback van de daadwerkelijke publicatie. Een groene CI-run of een succesvolle recovery-invocation zonder provider-side effect is onvoldoende.
