import { readFile } from 'node:fs/promises';

const load = async path => JSON.parse(await readFile(new URL(`../../${path}`, import.meta.url), 'utf8'));

// The same append-only chat-learning shards that tools/delivery-preflight.mjs treats as PROVEN.
// Without them a rule whose lesson lives only in a chat shard can never block a planned action.
const CHAT_LESSON_SHARDS = [
  'config/brain-chat-learning-contract.json',
  'brain/learning/chat-continuity-2026-08-30.json',
  'brain/learning/current-execution-lessons-2026-08-30.json',
  'brain/learning/remediation-ownership-2026-08-30.json',
  'brain/learning/ci-efficiency-lessons-2026-08-30.json',
];

export async function loadChatLessons(activeRuleIds) {
  const active = new Set(activeRuleIds);
  const shards = await Promise.all(CHAT_LESSON_SHARDS.map(load));
  return shards
    .flatMap(shard => [...(shard.lessons || []), ...(shard.powerhouse_lessons || [])])
    .map(lesson => ({
      fingerprint: lesson.fingerprint,
      rootCause: lesson.rootCause,
      fix: lesson.requiredAction,
      preventionRule: lesson.preventionRule || (active.has(lesson.id) ? lesson.id : null),
      status: 'PROVEN',
      source: 'chat-learning',
    }))
    .filter(lesson => lesson.preventionRule && lesson.fingerprint && lesson.rootCause && lesson.fix);
}

export async function loadGuardKnowledge() {
  const [lessonsDoc, rulesDoc, triggersDoc] = await Promise.all([
    load('docs/brain/delivery-failure-lessons.json'),
    load('config/delivery-prevention-rules.json'),
    load('config/planned-action-triggers.json'),
  ]);
  const rules = rulesDoc.rules || [];
  const chatLessons = await loadChatLessons(rules.filter(rule => rule?.active === true).map(rule => rule.id));
  // Delivery lessons first: for a rule that has both, the existing lesson still wins.
  return { lessons: [...(lessonsDoc.lessons || []), ...chatLessons], rules, triggers: triggersDoc.rules || [] };
}

// Matches a planned action (free text) against the existing PROVEN lessons and active rules.
// Fail-closed: a matching rule blocks until the caller names it in `acknowledged`, which means
// "I read the lesson and my plan follows its fix". Unknown acknowledgements are an error.
export function matchPlannedAction({ action, lessons, rules, triggers, acknowledged = [] }) {
  const text = String(action ?? '').toLowerCase();
  if (!text.trim()) throw new TypeError('planned action text is required');
  const active = new Map(rules.filter(rule => rule?.active === true).map(rule => [rule.id, rule]));
  for (const id of acknowledged) {
    if (!active.has(id)) throw new Error(`acknowledged rule is not an active prevention rule: ${id}`);
  }
  const ack = new Set(acknowledged);
  const matches = [];
  for (const trigger of triggers) {
    const rule = active.get(trigger.ruleId);
    if (!rule) continue;
    if (!trigger.systems.some(word => text.includes(word)) || !trigger.actions.some(word => text.includes(word))) continue;
    const lesson = lessons.find(item => item.status === 'PROVEN' && item.preventionRule === trigger.ruleId);
    if (!lesson) continue;
    matches.push({
      ruleId: trigger.ruleId,
      fingerprint: lesson.fingerprint,
      rootCause: lesson.rootCause,
      fix: lesson.fix,
      enforcedBy: rule.enforcedBy || 'preflight',
      acknowledged: ack.has(trigger.ruleId),
    });
  }
  const unacknowledged = matches.filter(match => !match.acknowledged);
  return { ok: unacknowledged.length === 0, matches, unacknowledged };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const value = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : ''; };
  const knowledge = await loadGuardKnowledge();
  const result = matchPlannedAction({
    action: value('--action'),
    ...knowledge,
    acknowledged: value('--ack').split(',').map(item => item.trim()).filter(Boolean),
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) {
    process.stderr.write(`BLOCKED: read the fix of each rule, follow it, then rerun with --ack ${result.unacknowledged.map(item => item.ruleId).join(',')}\n`);
    process.exit(1);
  }
}
