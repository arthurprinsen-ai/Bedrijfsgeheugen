# Powerhouse Live-Until-Proven Status Contract

Fingerprint: `powerhouse-live-until-proven-v1`

Deze regel is onderdeel van `powerhouse-engineering-os-v1` en geldt voor alle bestaande en toekomstige chats, agents en materiële workflows. Er ontstaat geen tweede status-, memory- of deliverylaag.

## Kernregel

`LIVE & BEWEZEN` is de enige succesvolle terminale status.

`DEELS LIVE` en `NIET GEDAAN` zijn tussenstatussen. Als verdere veilige technische actie mogelijk is, blijft de owner agent/chat werken via diagnose, oorzaakfix, tests, preview, protected delivery, productie-readback, regressiepreventie en learning/writeback totdat `LIVE & BEWEZEN` aantoonbaar is.

`GEBLOKKEERD` is alleen geldig bij een bewezen harde grens volgens de bestaande Engineering OS-hard-boundaries. Een oplosbare buildfout, rode gate, migratiedrift, ontbrekende readback, open PR, ontbrekende deploy, configuratiefout of nog niet uitgevoerde test is op zichzelf geen geldige terminale blokkade.

## Verplicht recovery packet bij GEBLOKKEERD

Iedere harde blokkade moet minimaal bevatten:

1. `blocker` — exact wat de voortgang stopt;
2. `root_cause_or_best_evidence` — bewezen root cause of het sterkste beschikbare bewijs;
3. `evidence` — concrete fout, check, run, readback, log of andere traceerbare evidence;
4. `attempted_repairs` — welke herstelacties al zijn uitgevoerd en met welke uitkomst;
5. `safe_actions_remaining` — wat technisch nog veilig kan zonder de harde grens te overschrijden;
6. `minimum_human_action` — de kleinst mogelijke menselijke toestemming/actie die nog nodig is;
7. `fix_agent_handoff` — een direct bruikbaar overdrachtspakket voor een gespecialiseerde fix-agent/chat.

## Verplichte fix-agent/chat handoff

De fix-agent/chat krijgt minimaal mee: probleemcontext, actuele state, evidence, mislukte pogingen, bekende root cause, open obligations, betrokken componenten, eventuele harde grens en eerstvolgende veilige acties. Doelstatus is altijd `LIVE & BEWEZEN`.

Wanneer de harde grens verdwijnt, wordt de open recovery automatisch hervat; de blokkade mag niet als vergeten eindpunt blijven bestaan.

## Samenhang met bestaande authorities

- `AGENTS.md`: self-healing, `RED MEANS AGENTS KEEP WORKING`, hard boundaries en Definition of Done.
- `config/powerhouse-engineering-os.json`: machineleesbare status-policy en authority-map.
- `scripts/brain/powerhouse-engineering-os.mjs`: fail-closed validator van deze policy.
- `tests/brain-powerhouse-engineering-os-contract.test.mjs`: regressiecontract in Required test.
- `BRAIN-DELIVERY-v2`: protected delivery en exacte candidate identity.
- shared context / BG167 en learning-writeback / BG168/BG166: contextoverdracht, herstelbewijs en preventielearning.
- Notion System Map en Menselijk Handboek: human-readable projectie, nooit deployed source authority.

## Operationele beslisregel

**Kan de agent/chat nog veilig iets doen?** Dan doorgaan.

**Is er aantoonbaar een harde grens?** Dan productie waar mogelijk veilig groen houden, recovery packet maken, fix-agent/chat-handoff genereren en alleen de minimale externe actie vragen.

**Is de grens opgeheven?** Dan onmiddellijk recovery hervatten tot `LIVE & BEWEZEN` met productie-evidence en writeback.


## User-facing reporting silence — terminal outcomes only

De technische waarheid blijft fail-closed en volledig bewijsbaar, maar de chat is geen CI-console. Interne deliverydetails zoals SHA's, refs, open/queued gates, PR-synchronisatie, deploy-progress en provider polling worden intern afgehandeld en duurzaam gelogd.

De gebruiker krijgt standaard pas bericht bij een terminale uitkomst. Alleen een bewezen `BLOCKED_HARD_BOUNDARY` mag eerder eigenaarschap teruggeven, en dan uitsluitend met de minimaal vereiste externe actie. Technische diagnostiek wordt alleen op expliciet verzoek in de chat uitgewerkt.

Dit vervangt de eerdere ruimte om tijdens uitvoering tussentijdse delivery-status te tonen.


## Expliciete terminale terugkoppeling
Fingerprint: `delivery|terminal-live-handoff|main-netlify-browser-live|v1`.

Iedere materiële website-afronding rapporteert afzonderlijk:
- `MAIN`;
- `NETLIFY_PRODUCTION`;
- `WEBSITE_READBACK`;
- `LIVE`;
- `BORGING`.

Functioneel bewezen productie kan `LIVE=true` zijn terwijl alleen governance-writeback nog wordt afgerond; dat heet `BORGING_PENDING`, nooit "nog aan het ontwikkelen". Een nieuwe opdracht "zet live" begint daarom met productie-reconciliatie. Als het gewenste gedrag al live is, mag geen nieuwe feature-implementatie, parallelle PR of onnodige redeploy worden gestart.

Terminale vorm: **MAIN ✓ | NETLIFY PRODUCTION ✓ | WEBSITE READBACK ✓ | LIVE ✓ | BORGING ✓**.
