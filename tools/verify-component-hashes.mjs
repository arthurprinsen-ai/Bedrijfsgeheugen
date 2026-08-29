export function compareSiblingHashes({ targetComponent, baseHashes, headHashes }) {
  const siblings = new Set([...Object.keys(baseHashes), ...Object.keys(headHashes)]);
  siblings.delete(targetComponent);
  const changedSiblings = [...siblings]
    .filter(id => baseHashes[id] !== headHashes[id])
    .sort();
  return { ok: changedSiblings.length === 0, changedSiblings };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [targetComponent, baseJson, headJson] = process.argv.slice(2);
  if (!targetComponent || !baseJson || !headJson) {
    throw new Error('Usage: node tools/verify-component-hashes.mjs <target> <base-json> <head-json>');
  }
  const result = compareSiblingHashes({
    targetComponent,
    baseHashes: JSON.parse(baseJson),
    headHashes: JSON.parse(headJson)
  });
  if (!result.ok) {
    console.error(`Protected sibling components changed: ${result.changedSiblings.join(', ')}`);
    process.exitCode = 1;
  }
}
