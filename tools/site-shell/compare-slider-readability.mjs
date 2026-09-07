const hasCompareSlider = source => /class=["'][^"']*compare-slider\b/i.test(source) || (/role=["']slider["']/i.test(source) && /--split\b/.test(source) && /clip-path\s*:/i.test(source));

export function validateCompareSliderSource(source, { path = '<inline>' } = {}) {
  if (!hasCompareSlider(source)) return [];
  const errors = [];

  const clampMatches = source.match(/Math\.max\(\s*30\s*,\s*Math\.min\(\s*70\s*,/g) || [];
  if (clampMatches.length < 2) {
    errors.push({
      code: 'UNSAFE_COMPARE_RANGE',
      path,
      message: 'Vergelijkingsslider moet voor pointer én toetsenbord binnen 30–70% blijven zodat beide tekstblokken leesbaar blijven.'
    });
  }

  const beforeCopyTracksSplit = /\.compare-before\s+\.compare-copy\s*\{[^}]*width\s*:[^;}]*var\(\s*--split\s*\)/is.test(source);
  const afterCopyTracksSplit = /\.compare-after\s+\.compare-copy\s*\{[^}]*width\s*:[^;}]*var\(\s*--split\s*\)/is.test(source);
  if (!beforeCopyTracksSplit || !afterCopyTracksSplit) {
    errors.push({
      code: 'COPY_NOT_BOUND_TO_VISIBLE_SPLIT',
      path,
      message: 'Tekstbreedte moet aan de zichtbare split gekoppeld zijn; vaste copybreedtes kunnen tekst onder de clip schuiven.'
    });
  }

  const knobTags = source.match(/<[^>]+class=["'][^"']*compare-knob\b[^"']*["'][^>]*>/gi) || [];
  const ariaSafe = knobTags.length > 0 && knobTags.every(tag => /aria-valuemin=["']30["']/i.test(tag) && /aria-valuemax=["']70["']/i.test(tag));
  if (!ariaSafe) {
    errors.push({
      code: 'ARIA_RANGE_MISMATCH',
      path,
      message: 'ARIA-min/max moet exact dezelfde 30–70%-grens communiceren als de werkelijke interactie.'
    });
  }

  return errors;
}
