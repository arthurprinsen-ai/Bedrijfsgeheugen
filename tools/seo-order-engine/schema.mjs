import { ORIGIN } from './registry.mjs';

const ORGANIZATION_ID = `${ORIGIN}/#organization`;
const WEBSITE_ID = `${ORIGIN}/#website`;
const PERSON_ID = `${ORIGIN}/over-ons#arthur-prinsen`;

function breadcrumbNode(meta) {
  const canonical = meta.canonical;
  const items = (meta.breadcrumbs || []).map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url
  }));
  return {
    '@type': 'BreadcrumbList',
    '@id': `${canonical}#breadcrumb`,
    itemListElement: items
  };
}

function organizationNode() {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'Bedrijfsgeheugen',
    url: `${ORIGIN}/`,
    logo: { '@type': 'ImageObject', url: `${ORIGIN}/assets/merk/logo-merk.png` }
  };
}

function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${ORIGIN}/`,
    name: 'Bedrijfsgeheugen',
    publisher: { '@id': ORGANIZATION_ID },
    inLanguage: 'nl-NL'
  };
}

function personNode() {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: 'Arthur Prinsen',
    url: `${ORIGIN}/over-ons`,
    worksFor: { '@id': ORGANIZATION_ID }
  };
}

function pageNode(meta) {
  const common = {
    url: meta.canonical,
    name: meta.title,
    description: meta.description,
    inLanguage: 'nl-NL',
    isPartOf: { '@id': WEBSITE_ID },
    breadcrumb: { '@id': `${meta.canonical}#breadcrumb` }
  };

  if (meta.schema_type === 'Article') {
    return {
      '@type': 'Article',
      '@id': `${meta.canonical}#article`,
      ...common,
      headline: meta.title,
      author: { '@id': PERSON_ID },
      publisher: { '@id': ORGANIZATION_ID },
      ...(meta.datePublished ? { datePublished: meta.datePublished } : {}),
      ...(meta.dateModified ? { dateModified: meta.dateModified } : {})
    };
  }

  if (meta.schema_type === 'Service') {
    return {
      '@type': 'Service',
      '@id': `${meta.canonical}#service`,
      ...common,
      provider: { '@id': ORGANIZATION_ID }
    };
  }

  const type = meta.schema_type === 'CollectionPage' ? 'CollectionPage' : 'WebPage';
  return {
    '@type': type,
    '@id': `${meta.canonical}#webpage`,
    ...common,
    about: { '@id': ORGANIZATION_ID }
  };
}

export function renderSeoGraph(meta) {
  if (!meta?.canonical?.startsWith(`${ORIGIN}/`)) throw new Error('canonical moet een absolute Bedrijfsgeheugen URL zijn');
  if (!meta?.title || !meta?.description) throw new Error('title en description zijn verplicht voor structured data');
  const graph = [organizationNode(), websiteNode()];
  if (meta.schema_type === 'Article') graph.push(personNode());
  graph.push(breadcrumbNode(meta));
  graph.push(pageNode(meta));
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function injectSeoGraph(input, meta) {
  let html = String(input);
  html = html.replace(/\s*<script\b[^>]*id=["']bg-seo-order-graph["'][^>]*>[\s\S]*?<\/script>\s*/gi, '');
  const json = JSON.stringify(renderSeoGraph(meta)).replace(/</g, '\\u003c');
  const script = `\n<script type="application/ld+json" id="bg-seo-order-graph">${json}</script>\n`;
  if (!/<\/head>/i.test(html)) throw new Error('HTML mist </head> voor SEO graph injectie');
  return html.replace(/<\/head>/i, `${script}</head>`);
}
