import test from 'node:test';
import assert from 'node:assert/strict';

// Revenue Command Center release gate: queue remains bounded to 15 evidence-backed actions.
const modulePath = new URL('../platform/linkedin-revenue-cockpit.mjs', import.meta.url);

async function loadRuntime() {
  return import(modulePath.href);
}

test('feed root is never concrete LinkedIn evidence', async () => {
  const { isConcreteLinkedInSource } = await loadRuntime();
  assert.equal(isConcreteLinkedInSource('https://www.linkedin.com/feed/'), false);
  assert.equal(isConcreteLinkedInSource('https://www.linkedin.com/in/arthur-prinsen'), true);
  assert.equal(isConcreteLinkedInSource('https://www.linkedin.com/posts/example-activity-123'), true);
  assert.equal(isConcreteLinkedInSource('https://www.linkedin.com/messaging/thread/abc/'), true);
});

test('send-ready text requires person, concrete source, evidence and personalized copy', async () => {
  const { isSendReady } = await loadRuntime();
  const base = {
    person: 'Ada Example',
    linkedinUrl: 'https://www.linkedin.com/in/ada-example',
    sourceUrl: 'https://www.linkedin.com/messaging/thread/abc/',
    readyText: 'Hoi Ada, je vraag over de overdracht van proceskennis raakte precies aan iets dat ik vaak zie bij groeiende teams.',
    contextEvidence: 'Vorige boodschap ging over overdracht van proceskennis.',
    contactPolicy: 'Vrij'
  };
  assert.equal(isSendReady(base), true);
  assert.equal(isSendReady({ ...base, sourceUrl: 'https://www.linkedin.com/feed/' }), false);
  assert.equal(isSendReady({ ...base, contextEvidence: '' }), false);
  assert.equal(isSendReady({ ...base, readyText: 'Hoi , ik zag jullie uitvraag. Wat weegt bij jullie nu het zwaarst?' }), false);
  assert.equal(isSendReady({ ...base, contactPolicy: 'Niet benaderen' }), false);
});

test('priority queue is deterministic, suppresses blocked contacts and caps at 15', async () => {
  const { buildPriorityQueue } = await loadRuntime();
  const candidates = Array.from({ length: 20 }, (_, index) => ({
    id: `c-${index}`,
    person: `Person ${index}`,
    linkedinUrl: `https://www.linkedin.com/in/person-${index}`,
    waitingOnMe: index < 3,
    priority: index < 5 ? '1 — Nu' : '2 — Later',
    driveStatus: index === 4 ? 'Nu' : '',
    confidence: 70 - index,
    expectedValue: 1000 + index * 100,
    contactPolicy: index === 2 ? 'Niet benaderen' : 'Vrij'
  }));
  const queueA = buildPriorityQueue(candidates, { limit: 15 });
  const queueB = buildPriorityQueue([...candidates].reverse(), { limit: 15 });
  assert.equal(queueA.length, 15);
  assert.deepEqual(queueA.map(item => item.id), queueB.map(item => item.id));
  assert.ok(!queueA.some(item => item.id === 'c-2'));
  assert.equal(queueA[0].waitingOnMe, true);
});

test('basic auth comparison validates exact existing credentials without leaking them', async () => {
  const { basicAuthMatches } = await loadRuntime();
  const header = `Basic ${Buffer.from('arthur:correct horse battery staple').toString('base64')}`;
  assert.equal(basicAuthMatches(header, 'arthur', 'correct horse battery staple'), true);
  assert.equal(basicAuthMatches(header, 'arthur', 'wrong'), false);
  assert.equal(basicAuthMatches('', 'arthur', 'correct horse battery staple'), false);
});
