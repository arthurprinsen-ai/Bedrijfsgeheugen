/**
 * Preserve approved source words while making block boundaries explicit.
 * Formatting is deterministic, idempotent and independent of any AI provider.
 * Never constructs new questions, claims, links or FAQ answers.
 */
export function normalizeBlogMarkdownBlocks(value) {
  if (typeof value !== 'string') throw new TypeError('BLOG_BODY_NOT_TEXT');
  const source = value.replace(/\r\n?/g, '\n').trim();
  if (!source) return source;
  const kind = (line) => /^#{2,3}[ \t]+\S/.test(line.trim()) ? 'heading'
    : /^[ \t]*(?:[-*+]|\d+[.)])[ \t]+\S/.test(line) ? 'list' : 'text';
  const result = [];
  let previous = null;
  for (const line of source.split('\n')) {
    if (!line.trim()) {
      if (result.length && result[result.length - 1] !== '') result.push('');
      previous = null;
      continue;
    }
    const current = kind(line);
    const boundary = previous !== null && (
      current === 'heading' || previous === 'heading'
      || (current === 'list' && previous === 'text')
      || (current === 'text' && previous === 'list')
    );
    if (boundary && result[result.length - 1] !== '') result.push('');
    result.push(line);
    previous = current;
  }
  return result.join('\n').trim();
}
