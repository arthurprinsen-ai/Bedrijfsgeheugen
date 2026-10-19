// Bounded, optional second-provider transport for approved static NL->EN publication
// cache creation. Production deployment remains offline and requires full cache.
export function assertFaithfulTranslationBatch(sources, translated) {
  if (!Array.isArray(sources) || !Array.isArray(translated) ||
      translated.length !== sources.length ||
      translated.some(value => typeof value !== 'string' || !value.trim())) {
    throw new Error('OPENAI_I18N_RESPONSE_SHAPE_INVALID');
  }
  const invariants = value => ({
    urls: [...String(value).matchAll(/https?:\/\/[^\s<>"']+/gi)].map(match => match[0]).sort(),
    tokens: [...String(value).matchAll(/\{[a-zA-Z_][\w.-]*\}|\%\{[\w.-]+\}/g)].map(match => match[0]).sort(),
  });
  translated.forEach((value, index) => {
    const original = invariants(sources[index]), target = invariants(value);
    if (JSON.stringify(original) !== JSON.stringify(target)) {
      throw new Error('OPENAI_I18N_IMMUTABLE_TOKEN_MISMATCH:' + index);
    }
  });
  return translated;
}

export async function translateBatchWithOpenAI(strings, key, {
  fetchImpl = fetch,
  model = 'gpt-5-mini',
  timeoutMs = 60_000
} = {}) {
  if (!Array.isArray(strings) || !strings.length || strings.length > 18) {
    throw new Error('OPENAI_I18N_BATCH_LIMIT');
  }
  if (typeof key !== 'string' || !key.trim()) throw new Error('OPENAI_I18N_KEY_UNAVAILABLE');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {'authorization': 'Bearer ' + key, 'content-type': 'application/json'},
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: 6000,
        instructions: 'Translate the given array of Dutch website and marketing strings into fluent English. Preserve factual meaning, company/product names, URLs, numbers, currencies and placeholders exactly. Add no claims. Return a JSON object with a translations array in identical order and length.',
        input: JSON.stringify(strings),
        text: {format: {
          type: 'json_schema',
          name: 'static_i18n_translations',
          strict: true,
          schema: {
            type: 'object',
            properties: {translations: {type: 'array', items: {type: 'string'}}},
            required: ['translations'],
            additionalProperties: false
          }
        }}
      }),
      signal: controller.signal
    });
    if (!response.ok) {
      const error = new Error('OPENAI_I18N_HTTP_' + response.status);
      error.status = response.status;
      throw error;
    }
    const payload = await response.json();
    if (payload?.status && payload.status !== 'completed') throw new Error('OPENAI_I18N_INCOMPLETE');
    const raw = typeof payload?.output_text === 'string' ? payload.output_text :
      (Array.isArray(payload?.output) ? payload.output.flatMap(entry =>
        Array.isArray(entry?.content) ? entry.content.filter(item => item?.type === 'output_text').map(item => item.text) : []
      ).join('') : '');
    let value;
    try { value = JSON.parse(raw); } catch { throw new Error('OPENAI_I18N_JSON_INVALID'); }
    return assertFaithfulTranslationBatch(strings, value?.translations);
  } finally {
    clearTimeout(timer);
  }
}
