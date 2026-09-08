export const COMPLIANCE_CONTROL_TEMPLATES = Object.freeze([
  {
    id: 'AI-INVENTORY', framework: 'EU_AI_ACT', requirement: 'AI-systemen en use-cases zijn geïnventariseerd', severity: 'high', owner: 'AI Governance',
    sourceKeys: ['usesAI','aiInventoryPresent'], reason: 'Zonder actueel AI-register kunnen rol, risico, transparantie en toezicht niet betrouwbaar worden bepaald.',
    nextAction: 'Inventariseer alle AI-use-cases, modellen/providers, doelen, data-inputs, eigenaars en gebruikers.'
  },
  {
    id: 'AI-ROLE-RISK', framework: 'EU_AI_ACT', requirement: 'Rol en risicoclassificatie zijn per AI-use-case vastgesteld', severity: 'critical', owner: 'AI Governance',
    sourceKeys: ['usesAI','aiRolesClassified'], reason: 'Verplichtingen uit de AI Act hangen af van de rol en risicocategorie per toepassing.',
    nextAction: 'Classificeer per AI-use-case de organisatorische rol, risicocategorie en toepasselijke verplichtingen.'
  },
  {
    id: 'AI-LITERACY', framework: 'EU_AI_ACT', requirement: 'Passende AI-geletterdheid is georganiseerd', severity: 'medium', owner: 'People & Governance',
    sourceKeys: ['usesAI','aiLiteracyProgram'], reason: 'Medewerkers die AI inzetten moeten voldoende kennis hebben voor verantwoord gebruik en toezicht.',
    nextAction: 'Leg doelgroep, opleidingsniveau, training, deelnamebewijs en periodieke herhaling vast.'
  },
  {
    id: 'AI-TRANSPARENCY', framework: 'EU_AI_ACT', requirement: 'Toepasselijke AI-transparantie is zichtbaar en aantoonbaar', severity: 'high', owner: 'Product & Governance',
    sourceKeys: ['usesAI','aiTransparencyImplemented'], reason: 'Gebruikers moeten waar vereist weten dat zij met AI interageren of AI-output ontvangen.',
    nextAction: 'Bepaal per use-case de transparantieplicht en implementeer disclosure, labeling en bewijs van werking.'
  },
  {
    id: 'AI-HUMAN-OVERSIGHT', framework: 'EU_AI_ACT', requirement: 'Menselijk toezicht en escalatie zijn ingericht waar vereist', severity: 'high', owner: 'AI Governance',
    sourceKeys: ['usesAI','humanOversight'], reason: 'AI-output mag in risicovolle contexten niet zonder passende menselijke controle tot onomkeerbare besluiten leiden.',
    nextAction: 'Leg reviewmomenten, beslisbevoegdheid, override, escalatie en logging per relevante use-case vast.'
  },
  {
    id: 'CBW-SCOPE', framework: 'NIS2_CBW', requirement: 'Toepasselijkheid van NIS2/Cyberbeveiligingswet is formeel bepaald', severity: 'critical', owner: 'Security Governance',
    sourceKeys: ['nis2ScopeAssessed'], reason: 'Zonder scopebesluit is niet vast te stellen welke wettelijke zorg-, registratie- en meldplichten gelden.',
    nextAction: 'Bepaal sector, entiteitstype, omvang en eventuele bijzondere aanwijzing en leg de scopeconclusie met onderbouwing vast.'
  },
  {
    id: 'CBW-RISK-MGMT', framework: 'NIS2_CBW', requirement: 'Cyberrisicoanalyse en risicobeheersmaatregelen zijn aantoonbaar', severity: 'critical', owner: 'Security',
    sourceKeys: ['nis2Applicable','cyberRiskAssessment'], reason: 'Risicobeheersing is de basis voor passende technische, operationele en organisatorische maatregelen.',
    nextAction: 'Voer een actuele cyberrisicoanalyse uit en koppel risico’s aan controls, eigenaar, termijn en bewijs.'
  },
  {
    id: 'CBW-INCIDENT', framework: 'NIS2_CBW', requirement: 'Incidentdetectie, respons en meldproces zijn ingericht', severity: 'critical', owner: 'Security',
    sourceKeys: ['nis2Applicable','incidentProcess'], reason: 'Er moeten processen bestaan om significante incidenten tijdig te detecteren, beoordelen, escaleren en waar vereist te melden.',
    nextAction: 'Leg detectie, severity, 24u/72u/eindrapportage-tijdlijn, contactpersonen, beslisboom en oefenbewijs vast.'
  },
  {
    id: 'CBW-CONTINUITY', framework: 'NIS2_CBW', requirement: 'Continuïteit, back-up, herstel en crisismanagement zijn aantoonbaar getest', severity: 'high', owner: 'Operations & Security',
    sourceKeys: ['nis2Applicable','continuityTested'], reason: 'Beschikbaarheid en herstel moeten onder verstoring aantoonbaar beheerst blijven.',
    nextAction: 'Leg RTO/RPO, back-ups, restore-tests, crisisrollen en laatste oefenresultaat vast.'
  },
  {
    id: 'CBW-SUPPLY-CHAIN', framework: 'NIS2_CBW', requirement: 'Leveranciers- en ketenrisico’s worden beheerst', severity: 'high', owner: 'Security & Procurement',
    sourceKeys: ['nis2Applicable','supplierSecurity'], reason: 'Externe diensten en leveranciers kunnen directe cyber- en continuïteitsrisico’s introduceren.',
    nextAction: 'Inventariseer kritieke leveranciers, eisen, verwerkers/subprocessors, afhankelijkheden, exit en periodieke review.'
  },
  {
    id: 'CBW-IAM', framework: 'NIS2_CBW', requirement: 'Toegang, authenticatie en passende MFA zijn beheerst', severity: 'critical', owner: 'Security',
    sourceKeys: ['nis2Applicable','accessControls'], reason: 'Onvoldoende identiteits- en toegangsbeheer vergroot de kans op ongeautoriseerde toegang en incidentimpact.',
    nextAction: 'Leg rollen, least privilege, joiner-mover-leaver, beheeraccounts, MFA en periodieke access reviews met bewijs vast.'
  },
  {
    id: 'DATA-PROCESSING', framework: 'GDPR_DATA', requirement: 'Datacategorieën, doeleinden, grondslag en verwerking zijn inzichtelijk', severity: 'high', owner: 'Privacy & Data',
    sourceKeys: ['processesPersonalData','processingRegister'], reason: 'Zonder verwerkingsinzicht zijn privacy, bewaartermijnen, toegangsrechten en AI-datagebruik niet controleerbaar.',
    nextAction: 'Leg per gegevensstroom categorie, doel, grondslag, betrokkenen, ontvangers, bewaartermijn en beveiliging vast.'
  },
  {
    id: 'DATA-LOCATION', framework: 'GDPR_DATA', requirement: 'Opslag- en verwerkingslocaties zijn technisch en contractueel bekend', severity: 'high', owner: 'Privacy & Technology',
    sourceKeys: ['dataLocationsKnown'], reason: 'Dataresidentie en eventuele doorgifte kunnen alleen worden beoordeeld als de feitelijke verwerkingslocaties bekend zijn.',
    nextAction: 'Maak een verifieerbare datamap: systeem → provider → regio → datacategorie → doel → doorgifte → bewijs.'
  },
  {
    id: 'DATA-SUBPROCESSORS', framework: 'GDPR_DATA', requirement: 'Verwerkers en subprocessors zijn actueel geregistreerd', severity: 'medium', owner: 'Privacy & Procurement',
    sourceKeys: ['subprocessorsRegistered'], reason: 'Externe partijen moeten zichtbaar zijn om toegang, doel, locatie, contracten en ketenrisico te kunnen beoordelen.',
    nextAction: 'Actualiseer het subprocessorregister inclusief doel, data, regio, contract/DPA en laatste review.'
  }
]);
