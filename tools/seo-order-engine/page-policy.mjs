import { entryForCanonical, ORIGIN } from './registry.mjs';

const POLICY = new Map(Object.entries({
  [`${ORIGIN}/afmaakindex`]: { page_class: 'utility', owner: `${ORIGIN}/` },
  [`${ORIGIN}/ai-in-bi`]: { page_class: 'support', owner: `${ORIGIN}/ai-implementeren` },
  [`${ORIGIN}/ai-in-data-engineering`]: { page_class: 'support', owner: `${ORIGIN}/ai-implementeren` },
  [`${ORIGIN}/ai-marketing-mkb`]: { page_class: 'support', owner: `${ORIGIN}/ai-adoptie` },
  [`${ORIGIN}/ai-voor-bestuurders`]: { page_class: 'support', owner: `${ORIGIN}/ai-governance` },
  [`${ORIGIN}/begrippen`]: { page_class: 'support', owner: `${ORIGIN}/` },
  [`${ORIGIN}/benchmark`]: { page_class: 'support', owner: `${ORIGIN}/product` },
  [`${ORIGIN}/connect`]: { page_class: 'conversion', owner: `${ORIGIN}/frisse-blik` },
  [`${ORIGIN}/contact`]: { page_class: 'conversion', owner: `${ORIGIN}/frisse-blik` },
  [`${ORIGIN}/data-soevereiniteit`]: { page_class: 'support', owner: `${ORIGIN}/ai-governance` },
  [`${ORIGIN}/expertises`]: { page_class: 'pillar', owner: `${ORIGIN}/` },
  [`${ORIGIN}/frisse-blik`]: { page_class: 'conversion', owner: `${ORIGIN}/frisse-blik` },
  [`${ORIGIN}/hoe-het-werkt`]: { page_class: 'support', owner: `${ORIGIN}/product` },
  [`${ORIGIN}/monitor`]: { page_class: 'utility', owner: `${ORIGIN}/product` },
  [`${ORIGIN}/over-ons`]: { page_class: 'trust', owner: `${ORIGIN}/` },
  [`${ORIGIN}/privacy`]: { page_class: 'trust', owner: `${ORIGIN}/` },
  [`${ORIGIN}/voor-mkb`]: { page_class: 'pillar', owner: `${ORIGIN}/` },
  [`${ORIGIN}/wijzigingen-uitgelegd`]: { page_class: 'trust', owner: `${ORIGIN}/product` },
  [`${ORIGIN}/wijzigingen`]: { page_class: 'trust', owner: `${ORIGIN}/product` },
  [`${ORIGIN}/zelfscan`]: { page_class: 'conversion', owner: `${ORIGIN}/zelfscan` },
  [`${ORIGIN}/brochure`]: { page_class: 'support', owner: `${ORIGIN}/` },
  [`${ORIGIN}/cijfers-bedrijfsoverdracht`]: { page_class: 'support', owner: `${ORIGIN}/due-diligence` },
  [`${ORIGIN}/kennisverlies-vergrijzing-mkb`]: { page_class: 'support', owner: `${ORIGIN}/bedrijfsgeheugen` },
  [`${ORIGIN}/ai-cijfers-mkb`]: { page_class: 'support', owner: `${ORIGIN}/ai-adoptie` },
  [`${ORIGIN}/waarom-ai-projecten-mislukken`]: { page_class: 'support', owner: `${ORIGIN}/ai-implementeren` },
  [`${ORIGIN}/excel-als-crm`]: { page_class: 'support', owner: `${ORIGIN}/bedrijfsprocessen-automatiseren` },
  [`${ORIGIN}/ai-capability-model`]: { page_class: 'support', owner: `${ORIGIN}/ai-adoptie` }
}));

export function classifyCanonical(url, registry) {
  const entry = entryForCanonical(url, registry);
  if (entry) return { page_class: entry.role, owner: entry.route, registered: true, entry };
  const policy = POLICY.get(url);
  if (!policy) return null;
  const ownerEntry = entryForCanonical(policy.owner, registry);
  return { ...policy, registered: false, ownerEntry };
}

export function explicitPolicyUrls() { return [...POLICY.keys()]; }
