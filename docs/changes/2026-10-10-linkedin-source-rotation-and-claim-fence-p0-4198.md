# LinkedIn structureel herstel — publicatieclaims en content-uniciteit

Datum: 2026-10-10. Canonieke chain: Brain → content-orchestrator → social-publisher → provider-side bewijs → outcomes.

De persoonlijke LinkedIn-publicatie was eerder geweigerd door LinkedIn vanwege een te lange tekst. De dagautoriteit was wel verbruikt maar er is geen externe post-URN. Een tweede verzending zonder onafhankelijke providerreconciliatie kan een duplicaat creëren. De contentgenerator leest daarom voortaan de werkelijk verbruikte, niet-ingetrokken dagautoriteiten en heropent die kanaalclaim niet.

De bedrijfspagina stuitte op een echte semantic/story-family-duplicate. De bestaande contentgenerator onthoudt nu per kanaal welke bronaanbeveling de duplicaatweigering veroorzaakte. Na een pre-provider afwijzing selecteert hij deterministisch een **andere**, geschikte, evidence-bound aanbeveling. Hij gebruikt exact dezelfde publicatie-ID, hetzelfde kanaal en de oorspronkelijke duplicaatcontrole. Als er geen veilige bron overblijft, stopt het kanaal zonder een duplicaat of verzonnen verhaal te publiceren.

OAuth is geen programmeerbaar recht: de bedrijfspagina vraagt werkelijke organisatiebeheer- en schrijfautorisatie bij de provider. De bestaande uitgever valideert die live; metadata in Brain alleen is geen bewijs. Verificatie van verzending vereist LinkedIn provider-URN en exacte contentreadback, gevolgd door geregistreerde opbrengst.

Regression: `tests/brain-linkedin-source-rotation-and-consumed-capability-p0-4198.test.mjs`. Release: protected CI, merge, Edge deployment met bronpariteit en provider-statuscontrole. Geen Buffer/Make/parallelle sender als fallback.
