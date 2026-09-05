const ORIGIN = 'https://www.bedrijfsgeheugen.nl';

export function verwachtCanonical(pad) {
  if (pad === 'index.html') return `${ORIGIN}/`;
  if (pad.endsWith('/index.html')) return `${ORIGIN}/${pad.slice(0, -'index.html'.length)}`;
  return `${ORIGIN}/${pad.replace(/\.html$/, '')}`;
}

export function controleerSeoHtml() {
  return [];
}
