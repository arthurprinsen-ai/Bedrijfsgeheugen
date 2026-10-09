// Canonical Instagram story bridge. Every mapped ID is from config/powerhouse-problem-library.json.
// All scenes are illustrative, never claims about an actual client. No standalone sender is created.
export const MIRA_PORTAL_STORY_CONTRACT = 'mira-entrepreneur-portal-story-v1';
export const MIRA_PORTAL_PROBLEMS = Object.freeze({
  'PH-P001': {name:'Eigenaar is operationele bottleneck',scene:'Mira hoort drie keer op één ochtend: dat moet de directeur eerst goedkeuren.',cause:'niemand anders heeft een duidelijk mandaat of een vastgelegde beslisregel',effect:'werk blijft wachten en dezelfde vraag komt telkens terug',portal:'strategie en uitvoering',action:'koppel de beslissing aan een verantwoordelijke, prioriteit en opvolgdatum',metric:'doorlooptijd van goedkeuringen',pointe:'Als alles bij één persoon eindigt, staat het hele bedrijf in diens wachtrij.'},
  'PH-P002': {name:'Offertes zonder opvolging',scene:'Mira opent vrijdag het CRM: drie offertes zijn verstuurd, maar niemand weet wie nog moet nabellen.',cause:'verzenden wel wordt vastgelegd, maar opvolging geen eigenaar of herinnering krijgt',effect:'kansen blijven liggen en niemand ziet wat nog moet gebeuren',portal:'commerciële acties en prioriteiten',action:'wijs de offerte een eigenaar, prioriteit en opvolgmoment toe',metric:'tijd tot opvolging en conversie',pointe:'Een offerte versturen is nog geen verkoopproces.'},
  'PH-P003': {name:'Groei zonder winst',scene:'Mira ziet dat de omzet groeit terwijl er op de bankrekening steeds minder lucht is.',cause:'omzet en kosten niet in dezelfde beslissing worden bekeken',effect:'drukte groeit, maar de financiële ruimte niet',portal:'financiële inzichten en impact',action:'onderzoek welke klant, dienst of kostenpost de marge raakt',metric:'brutomarge en EBITDA-marge',pointe:'Meer verkopen helpt pas als je weet wat je eraan overhoudt.'},
  'PH-P004': {name:'Dalende projectmarge',scene:'Mira viert het afgeronde project tot ze de extra uren en herstelwerk ziet.',cause:'afwijkingen niet tijdig aan het project en de raming worden gekoppeld',effect:'het project lijkt succesvol, maar levert minder op dan gepland',portal:'financiële risico’s en roadmap',action:'maak margeafwijkingen zichtbaar en wijs de correctie toe',metric:'projectmarge en budgetafwijking',pointe:'Afgerond is niet hetzelfde als rendabel.'},
  'PH-P005': {name:'Kennis bij sleutelpersonen',scene:'Mira zoekt de reden voor een bijzondere klantafspraak. Alleen de collega die vrij is, weet het.',cause:'afspraken en uitzonderingen alleen in gesprekken of losse berichten zijn vastgelegd',effect:'klanten moeten wachten en dezelfde fout kan opnieuw worden gemaakt',portal:'kennisborging en uitvoeringsacties',action:'leg de afspraak met de reden vast en wijs een tweede eigenaar toe',metric:'aandeel kritieke processen met vastgelegde kennis',pointe:'Informatie die maar één persoon weet, is nog geen bedrijfskennis.'},
  'PH-P006': {name:'Excel-afhankelijkheid',scene:'Mira opent drie spreadsheets met drie verschillende omzetcijfers. Alle drie heten ze definitief.',cause:'verschillende versies los van de bron worden bijgehouden',effect:'het MT discussieert over cijfers in plaats van besluiten',portal:'bronverbindingen, stuurinformatie en besluiten',action:'wijs de betrouwbare bron aan en markeer de afwijkingen',metric:'aantal kritieke spreadsheets en handmatige overdrachten',pointe:'Drie versies van de waarheid maken geen beter besluit.'},
  'PH-P007': {name:'Dubbele invoer',scene:'Mira typt hetzelfde klantadres opnieuw: eerst in het CRM, daarna in de facturatie en daarna in de planning.',cause:'systemen niet vanuit één geldige bron samenwerken',effect:'tijd gaat verloren en fouten verplaatsen zich van scherm naar scherm',portal:'procesverbetering en impactkaarten',action:'breng de dubbele overdracht in kaart en prioriteer de koppeling',metric:'uren handwerk en foutpercentage',pointe:'Drie keer invoeren is geen controle, maar drie kansen op een fout.'},
  'PH-P008': {name:'Capaciteitstekort',scene:'Mira ziet nieuwe aanvragen binnenkomen, terwijl de planning van volgende week al vol is.',cause:'vraag, beschikbaarheid en werkvoorraad niet naast elkaar worden gevolgd',effect:'de beloofde leverdatum schuift steeds verder op',portal:'capaciteit, prioriteiten en roadmap',action:'vergelijk verwachte vraag met beschikbare capaciteit en wijs een vervolgstap toe',metric:'bezettingsgraad en achterstand',pointe:'Een volle agenda is nog geen betrouwbare planning.'},
  'PH-P010': {name:'Debiteuren lopen op',scene:'Mira ziet een mooie omzetrapportage, maar moet toch uitzoeken waarom er te weinig geld binnenkomt.',cause:'openstaande facturen niet op ouderdom en eigenaar worden opgevolgd',effect:'de liquiditeitsruimte krimpt terwijl de omzet goed lijkt',portal:'financiële risico’s en opvolgacties',action:'prioriteer achterstallige facturen op ouderdom, bedrag en verantwoordelijke',metric:'DSO en achterstallig saldo',pointe:'Gefactureerd is niet hetzelfde als betaald.'},
  'PH-P011': {name:'Late facturering',scene:'Mira ontdekt dat het werk vorige maand al af was, maar niemand de factuur heeft gestart.',cause:'oplevering en facturering niet aan dezelfde processtap zijn gekoppeld',effect:'geld komt later binnen en werk blijft administratief openstaan',portal:'uitvoering, financiën en actiekaarten',action:'markeer ontbrekende factuurtriggers en wijs opvolging toe',metric:'dagen tussen oplevering en facturering',pointe:'Werk dat klaar is, moet niet weken wachten op een factuur.'},
  'PH-P012': {name:'Klantconcentratie',scene:'Mira merkt dat één grote klant alweer bijna de hele weekplanning bepaalt.',cause:'omzetafhankelijkheid niet zichtbaar naast capaciteit en risico wordt beoordeeld',effect:'één verandering bij die klant kan veel tegelijk raken',portal:'commerciële risico’s en scenarioanalyse',action:'laat klantconcentratie zien en bepaal de eerstvolgende risicobeperkende actie',metric:'omzetaandeel van de grootste klanten',pointe:'Een grote klant is prettig. Een blinde afhankelijkheid niet.'},
  'PH-P013': {name:'Klantverlies/churn',scene:'Mira ziet dat een vaste klant voor de derde keer minder bestelt, maar nergens staat een opvolgactie.',cause:'klantsignalen, omzetontwikkeling en verantwoordelijkheid los van elkaar staan',effect:'afnemende omzet pas zichtbaar wordt als het te laat is',portal:'klantsignalen, risico’s en vervolgstappen',action:'onderzoek de afname en leg eigenaar en contactmoment vast',metric:'klantbehoud en omzetontwikkeling',pointe:'Een klant vertrekt zelden op de dag dat je het merkt.'}
});
export const MIRA_TOPIC_TO_PROBLEM = Object.freeze({
  'directie-bottleneck':'PH-P001','offertes-zonder-opvolging':'PH-P002','groei-zonder-winst':'PH-P003',
  'projectmarge':'PH-P004','kennisoverdracht':'PH-P005','excel-chaos':'PH-P006',
  'dubbele-invoer':'PH-P007','capaciteitsplanning':'PH-P008','debiteuren':'PH-P010',
  'late-facturering':'PH-P011','klantafhankelijkheid':'PH-P012','klantverlies':'PH-P013'
});
export function miraProblemIdFromSource(source) {
  const evidence = source?.evidence || source?.metadata || source || {};
  const declared = String(evidence.portal_problem_id || evidence.problem_id || '').trim();
  const mapped = MIRA_TOPIC_TO_PROBLEM[String(source?.topic_key||evidence.topic_key||'').trim()] || '';
  if(declared && mapped && declared!==mapped) return null;
  const id=declared||mapped;
  return Object.hasOwn(MIRA_PORTAL_PROBLEMS,id)?id:null;
}
export function buildMiraEntrepreneurCaption(source) {
  const id=miraProblemIdFromSource(source);
  if(!id) throw new Error('MIRA_STORED_ENTREPRENEUR_PROBLEM_REQUIRED');
  const e=source?.evidence||source?.metadata||source||{};
  if(e.audience!=='ondernemers' || e.source_backed!==true) throw new Error('MIRA_ENTREPRENEUR_SOURCE_REQUIRED');
  const p=MIRA_PORTAL_PROBLEMS[id];
  const caption=[
    p.scene,
    'Het probleem ontstaat omdat '+p.cause+'. Daardoor '+p.effect+'.',
    'In het Bedrijfsgeheugen-portaal kun je '+p.portal+' bij elkaar brengen. De relevante volgende stap: '+p.action+'.',
    'Daarna kun je controleren of het helpt, bijvoorbeeld aan de hand van '+p.metric+'. Zonder echte klantgegevens is dat nog geen gemeten resultaat.',
    p.pointe,
    'Waar loopt dit bij jou vast? Bekijk de Frisse Blik via bedrijfsgeheugen.nl.',
    'Mira is een fictief AI-personage. Deze scène is illustratief, geen echte klantcase.'
  ].join('\n\n');
  return {problem_id:id,problem:p,caption,contract:MIRA_PORTAL_STORY_CONTRACT,source_id:String(e.source_signal_id||e.problem_source_id||''),illustrative:true};
}
