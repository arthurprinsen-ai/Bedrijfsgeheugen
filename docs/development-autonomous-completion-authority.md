# Powerhouse autonomous completion authority

Fingerprint: `powerhouse-autonomous-completion-authority-v1`
Status: active
Scope: all existing and future Powerhouse chats, agents and material workflows.

## Continuing authority

Bestaande, eerder vastgelegde Powerhouse-regels en ontwerpkeuzes gelden als doorlopende authority. Agents en chats gebruiken die authority zonder herhaalde goedkeuring aan de gebruiker te vragen. Formuleringen als “is dit akkoord?”, “zal ik doorgaan?” of “wil je dat ik dit borg?” zijn niet toegestaan wanneer het antwoord al uit de canonieke authority, eerdere besluiten of veilige defaults volgt.

De standaard is zelfstandig beslissen en uitvoeren binnen de bestaande security-, integrity-, truth-, cost- en release-gates. Alleen een werkelijk nieuwe keuze die niet uit bestaande authority kan worden opgelost, of een bewezen harde grens, mag de gebruiker onderbreken.

## Completion contract

`DEELS LIVE` en `NIET GEDAAN` zijn uitsluitend interne tussenstatussen. Bij veilig technisch oplosbaar resterend werk blijft dezelfde agent doorwerken door diagnose, root-cause-fix, regressietest, CI/release-gates, protected delivery, productie-readback en writeback totdat de status `LIVE & BEWEZEN` aantoonbaar is.

Een rode gate is diagnose-input en geen stopconditie. Gates worden niet omzeild of verzwakt; de onderliggende oorzaak wordt opgelost of de bestaande canonieke dependency wordt correct hergebruikt.

## Definition of Done

Een materiële taak is pas afgerond wanneer alle toepasselijke onderdelen bestaan:

- exact bewijs van kandidaat- en productie-identiteit;
- relevante tests en gates groen;
- functionele productie-readback/evidence;
- root cause en gekozen fix/besluit vastgelegd;
- outcome/value vastgelegd zonder onbewezen causaliteitsclaim;
- open obligations afgesloten of als bewezen hard boundary met herstelpacket vastgelegd;
- regressietest of preventieregel toegevoegd wanneer herhaling mogelijk is;
- actuele System Map/ADR/documentatie bijgewerkt waar relevant;
- herbruikbare learning canoniek teruggeschreven;
- writeback is zowel menselijk én machineleesbaar;
- volgende chats/agents kunnen de actuele state, evidence, fout, fix en learning zonder heruitvinden hergebruiken.

## Toegestane interrupties

Alleen deze klassen mogen autonome uitvoering onderbreken:

1. `novel_choice_not_resolvable_from_existing_authority`;
2. `secrets_credentials_permissions`;
3. `security_control_weakening`;
4. `destructive_irreversible_data`;
5. `paid_resource_increase`;
6. `legal_financial_commitment`.

Bij een harde grens rondt de agent eerst alle veilige onafhankelijke acties af en schrijft daarna één volledig recovery packet terug met blocker, bewijs, root cause/beste evidence, reeds uitgevoerde reparaties, resterende veilige acties, minimale menselijke actie en direct herbruikbare fix-agent-handoff richting `LIVE & BEWEZEN`.

## Canonieke implementatie

De machineleesbare authority staat in `config/powerhouse-engineering-os.json` onder `interaction_authority`. De regressie staat in `tests/brain-powerhouse-autonomous-completion-authority.test.mjs` en moet door `.github/workflows/required-test.yml` worden uitgevoerd. Deze regel breidt de bestaande Engineering OS/Brain authority uit en creëert geen tweede brain, memory, queue, registry of release authority.
