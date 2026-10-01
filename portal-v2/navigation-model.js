const freezePages=pages=>Object.freeze(pages.map(page=>Object.freeze(page)));

export const DESKTOP_NAV_GROUPS = Object.freeze([
  Object.freeze({id:'overview',label:'Overzicht',icon:'⌂',target:'overzicht',pages:freezePages([
    {id:'overview-home',label:'Overzicht',target:'overzicht'},
    {id:'overview-advice',label:'Advies',target:'advies'},
    {id:'overview-conclusion',label:'Eindconclusie',target:'eindconclusie'}
  ])}),
  Object.freeze({id:'csrd-impact',label:'CSRD & Impact',icon:'⌁',target:'csrd-impact',pages:freezePages([
    {id:'csrd-main',label:'CSRD & Impact',target:'csrd-impact'},
    {id:'csrd-compliance',label:'Compliance & governance',target:'compliance-governance'},
    {id:'csrd-command',label:'Compliance overzicht',target:'compliance-command-center'}
  ])}),
  Object.freeze({id:'health',label:'Bedrijfsgezondheid',icon:'♡',target:'profiel',pages:freezePages([
    {id:'health-profile',label:'Bedrijfsprofiel',target:'profiel'},
    {id:'health-context',label:'Bedrijfssituatie',target:'bedrijfssituatie'},
    {id:'health-kpis',label:'Cijfers & maatstaven',target:'cijfers-maatstaven'},
    {id:'health-value',label:'Waarde & financiering',target:'waarde-financiering'},
    {id:'health-businesscase',label:'Businesscase',target:'businesscase'}
  ])}),
  Object.freeze({id:'strategy',label:'Strategie & uitvoering',icon:'↗',target:'strategie-naar-maandagochtend',pages:freezePages([
    {id:'strategy-monday',label:'Strategie naar uitvoering',target:'strategie-naar-maandagochtend'},
    {id:'strategy-dna-nav',label:'Strategy DNA',target:'strategy-dna'},
    {id:'strategy-models',label:'Strategiemodellen',target:'strategiemodellen'},
    {id:'strategy-canvases',label:'Canvassen',target:'canvassen'},
    {id:'strategy-roadmap',label:'Roadmap',target:'roadmap'}
  ])}),
  Object.freeze({id:'processes',label:'Processen & organisatie',icon:'◎',target:'taken-werkstromen',pages:freezePages([
    {id:'process-workflows',label:'Taken & werkstromen',target:'taken-werkstromen'},
    {id:'process-people',label:'Mensen & rollen',target:'mensen'},
    {id:'process-current',label:'Actueel houden',target:'actueel-houden'},
    {id:'process-changes',label:'Wijzigingen',target:'wijzigingen'}
  ])}),
  Object.freeze({id:'knowledge',label:'Kennis',icon:'▤',target:'documenten',pages:freezePages([
    {id:'knowledge-docs',label:'Documenten',target:'documenten'},
    {id:'knowledge-research',label:'Onderzoek',target:'onderzoek'},
    {id:'knowledge-sources',label:'Bronnenbibliotheek',target:'bronnenbibliotheek'}
  ])}),
  Object.freeze({id:'data',label:'Data & koppelingen',icon:'◫',target:'koppelingen',pages:freezePages([
    {id:'data-overview',label:'Data & AI',target:'data-ai'},
    {id:'data-links',label:'Koppelingen',target:'koppelingen'},
    {id:'data-passport',label:'Data & AI Passport',target:'data-ai-passport'},
    {id:'data-status',label:'Datastatus',target:'datahubstatus'}
  ])}),
  Object.freeze({id:'ai',label:'AI & Insights',icon:'✦',target:'ai-scan',pages:freezePages([
    {id:'ai-opportunities',label:'AI-kansen',target:'ai-scan'},
    {id:'ai-capabilities-nav',label:'AI-capabilities',target:'ai-capabilities'},
    {id:'ai-trust',label:'AI Trust Center',target:'trust-center'},
    {id:'ai-external',label:'AI & technologie actueel',target:'ai-technologie-actueel'}
  ])}),
  Object.freeze({id:'actions',label:'Acties & impact',icon:'✓',target:'actieve-acties',pages:freezePages([
    {id:'actions-active',label:'Actieve acties',target:'actieve-acties'},
    {id:'actions-impact',label:'Impact & waarde',target:'os:impact-engine'},
    {id:'actions-outcomes',label:'Outcomes & bewijs',target:'outcomes-evidence'},
    {id:'actions-next',label:'Volgende beste acties',target:'os:next-best-actions'}
  ])}),
  Object.freeze({id:'reports',label:'Rapportages & beheer',icon:'▣',target:'audit',pages:freezePages([
    {id:'reports-audit',label:'Audit & rapportage',target:'audit'},
    {id:'reports-users',label:'Gebruikers',target:'gebruikers'},
    {id:'reports-settings',label:'Instellingen',target:'instellingen'},
    {id:'reports-billing',label:'Facturen & abonnement',target:'billing'},
    {id:'reports-scan',label:'Frisse Blik Scan',target:'frisse-blik'}
  ])})
]);

export const DESKTOP_NAV_ITEMS = Object.freeze(
  DESKTOP_NAV_GROUPS.map(({id,label,icon,target})=>Object.freeze({id,label,icon,target}))
);

export const PORTAL_NAV_ITEMS = Object.freeze([
  Object.freeze({ id:'overview', label:'Overzicht', target:'overzicht' }),
  Object.freeze({ id:'project', label:'Project', target:'hub:project' }),
  Object.freeze({ id:'data-ai', label:'Data & AI', target:'hub:data-ai' }),
  Object.freeze({ id:'tasks', label:'Taken', target:'hub:tasks' }),
  Object.freeze({ id:'more', label:'Meer', target:'hub:portal' })
]);

export function mobileTarget(id){
  return PORTAL_NAV_ITEMS.find(item=>item.id===id)?.target || null;
}

export function navigationUrl(target, base=globalThis.location?.href || 'https://www.bedrijfsgeheugen.nl/portal-v2/'){
  const url=new URL(base);
  url.searchParams.delete('page');
  url.searchParams.delete('hub');
  if(target?.startsWith('hub:')) url.searchParams.set('hub',target.slice(4));
  else if(target && target!=='overzicht') url.searchParams.set('page',target);
  return `${url.pathname}${url.search}${url.hash}`;
}
