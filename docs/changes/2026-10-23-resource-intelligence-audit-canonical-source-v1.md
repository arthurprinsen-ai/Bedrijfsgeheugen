# Powerhouse Resource Intelligence — herstel van canonieke auditbron

Datum: 23 oktober 2026. Bestaande CI-verbeterautoriteit: [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661).

## Bewezen fout

De echte geplande [Powerhouse Resource Intelligence-run #39937291073](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39937291073) mislukte voordat de regressietests konden starten: `RESOURCE_INTELLIGENCE_AUDIT_FAILED: missing required artifact supabase/migrations/20260917093000_powerhouse_resource_intelligence_v1.sql`. Dit bestand bestaat niet in de huidige repository en er is geen toegepaste productieversie met dat nummer. De bestaande contracttest gebruikt al de daadwerkelijke toegepaste `20260917094812_powerhouse_resource_intelligence_v1.sql`; de productiemigratiehistorie bevat deze versie.

De audit controleerde bovendien verouderde `energy_wh`/`water_ml`- en provenance-kolomnamen, terwijl de canonieke Resource Intelligence weergaven `energy_kwh`, `water_liters`, `co2e_kg`, `factor_coverage`, `provenance_complete` en bronbevestigde business value gebruiken.

## Afgebakend herstel

Alleen het bestaande read-only `scripts/brain/resource-intelligence-audit.mjs` is aangepast aan hetzelfde onveranderde migratiebestand als de contracttest. De audit controleert nog steeds de bestaande BG169-autoriteit, kosten/effect/provenance, terugdraai-plan, veilige omkeerbaarheid en alle verbodsbepalingen. Ook controleert hij dat niet-gemeten energie, water of CO₂ nooit als 0 worden ingevuld. De bestaande uitvoerbare contracttest roept de audit nu zelf aan en weigert een terugval naar het niet-bestaande migratiepad of verouderde eenheden.

Geen nieuwe migratie, geen SQL-wijziging, geen permissiewijziging, geen tweede scheduler, geen schatting van niet-gemeten energie/water/omzet, geen uitgeschakelde gate.

## Vereiste acceptatie

Exact-head Required CI en CodeQL groen; beveiligde merge naar `main`; daarna de oorspronkelijke Powerhouse Resource Intelligence-workflow werkelijk succesvol laten draaien en de bewijsregels teruglezen. Een groene audit valideert contractintegriteit, **niet** werkelijk bespaarde energie, geld of CO₂. Resultaten en kosten blijven `unknown` zolang onafhankelijke providerinformatie ontbreekt.

De native GitHub merge queue wordt niet als oplossing aangezet: de repository heeft bij de gecontroleerde GitHub-API `owner.type=User`, terwijl GitHub merge queues aanbiedt voor repositories van organisaties, onder bijbehorende voorwaarden. Bestaande branchregels blijven intact.
