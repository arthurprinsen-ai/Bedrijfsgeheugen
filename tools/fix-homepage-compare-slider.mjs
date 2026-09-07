const MARKER = 'data-bg-compare-slider-readable';

const READABLE_STYLE = `<style ${MARKER}>
/* Houd beide tekstkolommen binnen het daadwerkelijk zichtbare vlak van de vergelijking. */
.compare-before .compare-copy{width:min(45%,calc(var(--split) - 68px))}
.compare-after .compare-copy{width:min(45%,calc(100% - var(--split) - 68px));margin-left:auto}
</style>`;

export function applyHomepageCompareSliderReadability(html) {
  if (!html.includes('id="compareSlider"') && !html.includes("id='compareSlider'")) return html;

  let next = html;

  // De oude 8–92%-eindpunten sneden op telefoon de tekst vrijwel volledig af.
  // 30–70% is dezelfde begrenzing als in de geaccepteerde slider-fixed V18.5 build.
  next = next.replaceAll('Math.max(8,Math.min(92,', 'Math.max(30,Math.min(70,');
  next = next.replaceAll('Math.max(8, Math.min(92,', 'Math.max(30, Math.min(70,');

  // ARIA kan in de gegenereerde HTML in een andere attribuutvolgorde of quote-stijl staan.
  // Normaliseer de twee grenzen daarom onafhankelijk en behoud de rest van de knopmarkup.
  next = next.replace(/aria-valuemax=(['"])(?:92|70)\1/g, 'aria-valuemax="70"');
  next = next.replace(/aria-valuemin=(['"])(?:8|30)\1/g, 'aria-valuemin="30"');

  if (!next.includes('.compare-before .compare-copy{width:min(45%,calc(var(--split) - 68px))}')) {
    next = next.replace('</head>', `${READABLE_STYLE}\n</head>`);
  } else if (!next.includes(MARKER)) {
    // De historische V18.5 kan de regels al inline bevatten; marker dan zonder duplicatie.
    next = next.replace('</head>', `<meta ${MARKER}="true">\n</head>`);
  }

  // Fail closed: een gedeeltelijke patch mag nooit stilletjes als opgelost doorbouwen.
  // De gegenereerde V18-runtime bestaat zowel met als zonder spatie na de komma.
  if (!/Math\.max\(30,\s*Math\.min\(70,/.test(next) ||
      !/aria-valuemax=(['"])70\1/.test(next) ||
      !/aria-valuemin=(['"])30\1/.test(next)) {
    throw new Error('Homepage compare-slider readability guard kon de runtime-eindpunten niet borgen');
  }

  return next;
}
