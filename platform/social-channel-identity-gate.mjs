import fs from 'node:fs';
import crypto from 'node:crypto';

const contract = JSON.parse(
  fs.readFileSync(new URL('../config/social-channel-identity-contract.json', import.meta.url), 'utf8')
);

export const CHANNEL_IDENTITY_CONTRACT_ID = contract.contractId;
export const CHANNELS = Object.freeze(contract.channels);

const PERSONAL_ANCHOR = /\b(ik|mijn|mij|voor mij|ik zie|ik merk|ik vind|ik denk|in mijn|bij mij)\b/i;
const CORPORATE_VOICE = /\b(wij helpen|wij bieden|wij zorgen|onze klanten|onze aanpak|onze dienstverlening|onze expertise|neem contact op|vrijblijvend gesprek)\b/i;

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function requiredLineageMissing(lineage = {}) {
  return contract.requiredLineage.some((key) => !hasValue(lineage[key]));
}

function evidenceRefs(personalTruth = {}) {
  return Array.isArray(personalTruth.evidenceRefs)
    ? personalTruth.evidenceRefs.filter(hasValue)
    : [];
}

export function authorizeSocialPublication(input = {}) {
  const reasons = [];
  const channel = CHANNELS[input.channelKind];
  const text = String(input.text || '').trim();

  if (!channel) {
    reasons.push('UNKNOWN_CHANNEL_KIND');
  } else if (input.channelId !== channel.channelId) {
    reasons.push('CHANNEL_IDENTITY_MISMATCH');
  }

  if (!text) reasons.push('EMPTY_CONTENT');
  if (requiredLineageMissing(input.lineage)) reasons.push('LINEAGE_INCOMPLETE');

  if (input.channelKind === 'linkedin_personal') {
    const hasPersonalAnchor = PERSONAL_ANCHOR.test(text);
    const corporateVoice = CORPORATE_VOICE.test(text);
    const truthClass = input.personalTruth?.class;

    if (!hasPersonalAnchor) reasons.push('PERSONAL_ANCHOR_REQUIRED');
    if (corporateVoice && !hasPersonalAnchor) reasons.push('CORPORATE_VOICE_ON_PERSONAL');
    if (!contract.personalTruthClasses.includes(truthClass)) {
      reasons.push('FIRST_PERSON_TRUTH_CLASS_REQUIRED');
    }
    if (truthClass === 'author_experience' && contract.experienceRequiresEvidenceRefs && evidenceRefs(input.personalTruth).length === 0) {
      reasons.push('FIRST_PERSON_EVIDENCE_REQUIRED');
    }
  }

  if (input.channelKind === 'instagram_company' && channel?.requiresMiraGate && input.miraGatePassed !== true) {
    reasons.push('MIRA_GATE_REQUIRED');
  }

  const authorized = reasons.length === 0;
  const authorizationId = authorized
    ? crypto.createHash('sha256').update([
        contract.contractId,
        input.channelKind,
        input.channelId,
        input.lineage.contentId,
        input.lineage.predictionId,
        text
      ].join('|')).digest('hex')
    : null;

  return {
    authorized,
    failClosed: contract.failClosed === true,
    contractId: contract.contractId,
    expectedChannelId: channel?.channelId || null,
    authorizationId,
    reasons
  };
}
