const VALID_STATES = new Set(['GREEN', 'RED', 'UNKNOWN', 'NOT_REGISTERED', 'UNTESTED']);

export function recordSensorEvidence(history = [], observation = {}) {
  const sensor_id = String(observation.sensor_id || '').trim();
  if (!sensor_id) throw new Error('sensor_id is required');
  const state = VALID_STATES.has(observation.state) ? observation.state : 'UNKNOWN';
  return [...history, { ...observation, sensor_id, state, observed_at: observation.observed_at || new Date().toISOString() }];
}

export function summarizeSensorHistory(history = [], { sensorIds = [] } = {}) {
  const ids = new Set([...sensorIds, ...history.map(item => item.sensor_id).filter(Boolean)]);
  const sensors = {};
  for (const id of ids) {
    const rows = history.filter(item => item.sensor_id === id);
    const defects_caught = rows.reduce((sum, item) => sum + Number(item.defects_caught || 0), 0);
    const escaped_misses = rows.reduce((sum, item) => sum + Number(item.escaped_misses || 0), 0);
    const transitions = rows.slice(1).filter((item, index) => item.state !== rows[index].state).length;
    sensors[id] = {
      state: rows.length ? 'PROVEN_HISTORY' : 'NOT_PROVEN',
      runs: rows.length,
      defects_caught,
      escaped_misses,
      last_state: rows.at(-1)?.state || null,
      state_transitions: transitions,
    };
  }
  return { sensors };
}

export function classifyTestEffectiveness({ id, critical = false, history = [] } = {}) {
  if (critical) return { id, classification: 'PROTECTED_CRITICAL', auto_remove: false };
  if (history.length < 2) return { id, classification: 'INSUFFICIENT_EVIDENCE', auto_remove: false };
  const states = history.map(item => item.state);
  const transitions = states.slice(1).filter((state, index) => state !== states[index]).length;
  const defectYield = history.reduce((sum, item) => sum + Number(item.defects_caught || 0), 0);
  const escapedMisses = history.reduce((sum, item) => sum + Number(item.escaped_misses || 0), 0);
  if (transitions / (history.length - 1) >= 0.5) return { id, classification: 'FLAKY', auto_remove: false };
  if (defectYield > 0) return { id, classification: 'HIGH_VALUE', auto_remove: false };
  if (escapedMisses > 0) return { id, classification: 'MISSED_ESCAPED_DEFECT', auto_remove: false };
  return { id, classification: 'LOW_OBSERVED_YIELD', auto_remove: false };
}
