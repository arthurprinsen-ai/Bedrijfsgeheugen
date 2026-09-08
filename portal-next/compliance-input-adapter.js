import { COMPLIANCE_CONTROL_TEMPLATES } from './compliance-registry.js';

function hasOwn(data, key) { return Object.prototype.hasOwnProperty.call(data || {}, key); }
function evidenceFor(data, id) { return Array.isArray(data?.complianceEvidence?.[id]) ? data.complianceEvidence[id] : []; }
function verifiedAtFor(data, id) { return data?.complianceVerifiedAt?.[id] || null; }

function unknown(template, reason = null) {
  return {
    ...template,
    applicability: 'unknown',
    control: null,
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
        if (!hasOwn(customerData, 'usesAI')) return unknown(template, 'AI-gebruik is nog niet vastgesteld; daardoor is toepasselijkheid nog onbekend.');
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
        if (!hasOwn(customerData, 'nis2Applicable')) return unknown(template, 'Nog niet vastgesteld of de organisatie onder NIS2/Cyberbeveiligingswet valt.');
        if (customerData.nis2Applicable === false) return notApplicable(template, 'De actuele klantinvoer classificeert de organisatie als niet van toepassing; bewaar de scopeonderbouwing als bewijs.');
        const key = template.sourceKeys[1];
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
  // Legal applicability and compliance may never be inferred from repository presence alone.
  // A supplied scope decision is required before a framework control can become applicable.
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

export function readPortalComplianceInput(root = globalThis) {
  const candidates = [
    root?.BG_COMPLIANCE_INPUT,
    root?.Bedrijfsgeheugen?.compliance,
    root?.portalState?.compliance,
    root?.__PORTAL_STATE__?.compliance
  ];
  return candidates.find(value => value && typeof value === 'object') || {};
}
