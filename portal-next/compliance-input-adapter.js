import { COMPLIANCE_CONTROL_TEMPLATES } from './compliance-registry.js';

function hasOwn(data, key) { return Object.prototype.hasOwnProperty.call(data || {}, key); }
function evidenceFor(data, id) { return Array.isArray(data?.complianceEvidence?.[id]) ? data.complianceEvidence[id] : []; }
function verifiedAtFor(data, id) { return data?.complianceVerifiedAt?.[id] || null; }

function unknown(template, reason = null, control = null) {
  return {
    ...template,
    applicability: 'unknown',
    control,
    evidence: [],
    verifiedAt: null,
    reason: reason || `Nog niet betrouwbaar vast te stellen: benodigde informatie voor ${template.requirement.toLowerCase()} ontbreekt.`,
    nextAction: template.nextAction
  };
}

function applicable(template, implemented, data) {
  return {
    ...template,
    applicability: 'applicable',
    control: { implemented: Boolean(implemented) },
    evidence: evidenceFor(data, template.id),
    verifiedAt: verifiedAtFor(data, template.id)
  };
}

function notApplicable(template, reason) {
  return { ...template, applicability: 'not_applicable', control: null, evidence: [], verifiedAt: null, reason, nextAction: 'Herbeoordeel de scope wanneer activiteiten, sector, AI-gebruik of gegevensverwerking veranderen.' };
}

export function deriveLegacyPortalComplianceInput(portalState = {}) {
  const beleid = portalState?.beleid && typeof portalState.beleid === 'object' ? portalState.beleid : {};
  const established = key => Number(beleid[key] || 0) >= 2;
  const exercised = key => Number(beleid[key] || 0) >= 3;
  const input = { complianceEvidence: {}, complianceVerifiedAt: {} };

  // Reuse what the customer already entered, but do not infer legal scope, AI usage or evidence.
  if (Number(beleid.aibeleid || 0) > 0) input.humanOversight = established('aibeleid');
  if (Number(beleid.toegang || 0) > 0) input.accessControls = established('toegang');
  if (Number(beleid.incident || 0) > 0) input.incidentProcess = established('incident');
  if (Number(beleid.backup || 0) > 0 || Number(beleid.continu || 0) > 0) input.continuityTested = exercised('backup') && exercised('continu');
  if (Number(beleid.leverancier || 0) > 0 || Number(beleid.verwerker || 0) > 0) input.supplierSecurity = established('leverancier') && established('verwerker');
  if (Number(beleid.avg || 0) > 0) {
    input.processesPersonalData = true;
    input.processingRegister = established('avg');
  }
  if (Number(beleid.verwerker || 0) > 0) input.processorAgreements = established('verwerker');
  if (Number(beleid.infosec || 0) > 0) input.informationSecurityPolicy = established('infosec');

  input.legacyPortalPolicy = { ...beleid };
  return input;
}

export function buildCustomerControls(customerData = {}) {
  return COMPLIANCE_CONTROL_TEMPLATES.map(template => {
    switch (template.id) {
      case 'AI-INVENTORY':
        if (!hasOwn(customerData, 'usesAI')) return unknown(template, 'Niet bekend of de organisatie AI-systemen of AI-functionaliteit gebruikt.');
        if (customerData.usesAI === false) return notApplicable(template, 'Volgens de huidige invoer gebruikt de organisatie geen AI; herbeoordeling blijft nodig bij nieuw AI-gebruik.');
        return applicable(template, customerData.aiInventoryPresent === true, customerData);
      case 'AI-ROLE-RISK':
      case 'AI-LITERACY':
      case 'AI-TRANSPARENCY':
      case 'AI-HUMAN-OVERSIGHT': {
        if (!hasOwn(customerData, 'usesAI')) {
          const knownControl = template.id === 'AI-HUMAN-OVERSIGHT' && hasOwn(customerData, 'humanOversight') ? { implemented: customerData.humanOversight === true } : null;
          return unknown(template, 'AI-gebruik is nog niet formeel vastgesteld; bestaande beleidsinput wordt wel hergebruikt maar bepaalt de AI Act-scope niet.', knownControl);
        }
        if (customerData.usesAI === false) return notApplicable(template, 'Geen AI-gebruik opgegeven in de actuele scope.');
        const key = template.sourceKeys[1];
        return applicable(template, customerData[key] === true, customerData);
      }
      case 'CBW-SCOPE':
        if (!hasOwn(customerData, 'nis2ScopeAssessed')) return unknown(template, 'De NIS2/Cbw-scopebeoordeling is nog niet ingevuld of aangetoond.');
        return applicable(template, customerData.nis2ScopeAssessed === true, customerData);
      case 'CBW-RISK-MGMT':
      case 'CBW-INCIDENT':
      case 'CBW-CONTINUITY':
      case 'CBW-SUPPLY-CHAIN':
      case 'CBW-IAM': {
        const key = template.sourceKeys[1];
        if (!hasOwn(customerData, 'nis2Applicable')) {
          const knownControl = hasOwn(customerData, key) ? { implemented: customerData[key] === true } : null;
          return unknown(template, 'Nog niet vastgesteld of de organisatie onder NIS2/Cyberbeveiligingswet valt. Bestaande beveiligingsinput telt als context, niet als scopebesluit.', knownControl);
        }
        if (customerData.nis2Applicable === false) return notApplicable(template, 'De actuele klantinvoer classificeert de organisatie als niet van toepassing; bewaar de scopeonderbouwing als bewijs.');
        return applicable(template, customerData[key] === true, customerData);
      }
      case 'DATA-PROCESSING':
        if (!hasOwn(customerData, 'processesPersonalData')) return unknown(template, 'Niet vastgelegd of en welke persoonsgegevens worden verwerkt.');
        if (customerData.processesPersonalData === false) return notApplicable(template, 'Volgens de actuele invoer worden geen persoonsgegevens verwerkt; controleer dit bij nieuwe gegevensstromen.');
        return applicable(template, customerData.processingRegister === true, customerData);
      case 'DATA-LOCATION':
        if (!hasOwn(customerData, 'dataLocationsKnown')) return unknown(template, 'De feitelijke opslag- en verwerkingslocaties zijn nog niet ingevuld of geverifieerd.');
        return applicable(template, customerData.dataLocationsKnown === true, customerData);
      case 'DATA-SUBPROCESSORS':
        if (!hasOwn(customerData, 'subprocessorsRegistered')) return unknown(template, 'Niet bekend of alle verwerkers en subprocessors actueel zijn geregistreerd.');
        return applicable(template, customerData.subprocessorsRegistered === true, customerData);
      default:
        return unknown(template);
    }
  });
}

export function buildBedrijfsgeheugenControls(evidenceData = {}) {
  return COMPLIANCE_CONTROL_TEMPLATES.map(template => {
    const scope = evidenceData?.scopeDecisions?.[template.framework];
    if (scope === 'not_applicable') return notApplicable(template, 'Formele scopebeslissing geregistreerd als niet van toepassing.');
    if (scope !== 'applicable') return unknown(template, `Voor Bedrijfsgeheugen is voor ${template.framework} nog geen formele, evidence-backed toepasselijkheidsbeslissing gekoppeld.`);
    const implementation = evidenceData?.controls?.[template.id];
    return {
      ...template,
      applicability: 'applicable',
      control: implementation ? { implemented: implementation.implemented === true } : null,
      evidence: Array.isArray(implementation?.evidence) ? implementation.evidence : [],
      verifiedAt: implementation?.verifiedAt || null,
      reason: implementation?.reason || template.reason,
      nextAction: implementation?.nextAction || template.nextAction
    };
  });
}

function readLegacyPortalState(storage, context = {}) {
  if (!storage || typeof storage.length !== 'number') return null;
  const candidates = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !key.startsWith('bg_portaal_') || ['bg_portaal_open','bg_portaal_lead'].includes(key)) continue;
    try {
      const value = JSON.parse(storage.getItem(key) || 'null');
      if (value && typeof value === 'object' && (value.beleid || value.niveaus || value.cijfers)) candidates.push({ key, value });
    } catch (_) {}
  }
  if (!candidates.length) return null;
  const slug = context?.customerSlug;
  if (slug) {
    const direct = candidates.find(item => item.key.includes(slug));
    if (direct) return direct.value;
  }
  return candidates.length === 1 ? candidates[0].value : null;
}

export function readPortalComplianceInput(root = globalThis) {
  const candidates = [root?.BG_COMPLIANCE_INPUT, root?.Bedrijfsgeheugen?.compliance, root?.portalState?.compliance, root?.__PORTAL_STATE__?.compliance];
  const direct = candidates.find(value => value && typeof value === 'object');
  if (direct) return direct;
  try {
    const legacy = readLegacyPortalState(root?.localStorage, root?.BG_COMPLIANCE_CONTEXT || {});
    if (legacy) return deriveLegacyPortalComplianceInput(legacy);
  } catch (_) {}
  return {};
}
