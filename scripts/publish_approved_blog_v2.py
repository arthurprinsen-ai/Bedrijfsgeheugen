#!/usr/bin/env python3
import datetime as dt
import hashlib
import html
import json
import pathlib
import re
import sys

import publish_approved_blog as base


def queue_conditions(force=''):
    conditions = [
        {'property': 'Source Mode', 'select': {'equals': 'Approved central article'}},
        {'property': 'Dispatch status', 'select': {'equals': 'Pending'}},
        {'property': 'Autopublish toegestaan', 'checkbox': {'equals': True}},
        {'property': 'Quality gate', 'select': {'equals': 'Geslaagd'}},
        {'property': 'Herzien', 'select': {'equals': 'Goedgekeurd'}},
        {'property': 'Publicatiedatum', 'date': {'on_or_before': dt.date.today().isoformat()}},
    ]
    if force:
        conditions.append({'property': 'Slug', 'rich_text': {'equals': force}})
    return conditions


def get_rows(force='', page_size=100):
    return base.req(f'/data_sources/{base.QUEUE}/query', 'POST', {
        'filter': {'and': queue_conditions(force)},
        'sorts': [{'property': 'Publicatiedatum', 'direction': 'ascending'}],
        'page_size': page_size,
    }).get('results') or []


def get_queue(force=''):
    rows = get_rows(force, 2 if force else 100)
    if not rows:
        return None
    if force and len(rows) != 1:
        base.fail(f'Geforceerde slug is niet uniek; gevonden={len(rows)}')
    return rows[0]


def snapshot_from_row(row):
    p = row.get('properties') or {}
    return {
        'page': row['id'],
        'slug': base.txt(p, 'Slug'),
        'source': base.txt(p, 'Bron Content ID'),
        'cmd': base.txt(p, 'Publish Command ID'),
        'attempt': int(base.num(p, 'Dispatch attempt')),
        'title': base.txt(p, 'Titel'),
        'blogtext': base.txt(p, 'Approved Blogtekst'),
        'keyword': base.txt(p, 'Focus-zoekwoord'),
        'meta': base.txt(p, 'Meta-omschrijving'),
        'source_hash': base.txt(p, 'Approved Source Hash'),
    }


def list_candidates():
    candidates=[]
    for row in get_rows('',100):
        q=queue_contract(row)
        candidates.append({
            'content_id': f"blog:{q['slug']}",
            'slug': q['slug'],
            'source_content_id': q['source'],
            'title': q['title'],
            'keyword': q['keyword'],
            'eligible': True,
            'score': 0,
            'exploration': False,
        })
    print(json.dumps(candidates,ensure_ascii=False))


def select_due_slug():
    """Resolve one exact, already-approved due slug for scheduled publication."""
    rows = get_rows('', 100)
    if not rows:
        print('NO_DUE_BLOG')
        return None
    q = queue_contract(rows[0])
    print(q['slug'])
    return q['slug']


def actual_hash(q):
    payload = '\n'.join([q['source'], q['slug'], q['title'], q['keyword'], q['meta'], q['blogtext']])
    return hashlib.sha256(payload.encode()).hexdigest()


def queue_contract(row):
    q = snapshot_from_row(row)
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', q['slug']):
        base.fail('Queue bevat ongeldige slug')
    if q['cmd'].replace('\\|', '|') != f"seo-publish|{q['source']}|{q['slug']}":
        base.fail('Publish Command ID mismatch')
    if q['attempt'] >= 2:
        base.fail('Maximaal twee dispatchpogingen toegestaan')
    if not all([q['source'], q['title'], q['blogtext'], q['keyword'], q['meta'], q['source_hash']]):
        base.fail('Approved snapshot is incompleet')
    if not 120 <= len(q['meta']) <= 170:
        base.fail('Meta-omschrijving buiten toegestane lengte')
    return q


def seal_or_validate(row):
    q = queue_contract(row)
    actual = actual_hash(q)
    if q['source_hash'] == 'PENDING_SEAL':
        base.req(f"/pages/{q['page']}", 'PATCH', {
            'properties': {'Approved Source Hash': {'rich_text': [{'type': 'text', 'text': {'content': actual}}]}}
        })
        q['source_hash'] = actual
    elif q['source_hash'] != actual:
        base.fail('Approved Source Hash mismatch; snapshot is gewijzigd na sealing')
    return q


def faq_items(raw):
    items = []
    for line in raw.replace('\r\n', '\n').splitlines():
        match = re.match(r'^\s*FAQ:\s*(.+?)\s*\|\|\s*(.+?)\s*$', line)
        if match:
            question = match.group(1).strip()
            answer = match.group(2).strip()
            if question and answer:
                items.append((question, answer))
    return items


def article_figures(keyword):
    safe_keyword = html.escape(keyword)
    return f'''<div class="artikelvisuals" aria-label="Visuele samenvatting">
<figure class="artikel-figuur">
<svg viewBox="0 0 960 240" role="img" aria-labelledby="kwalificatie-title kwalificatie-desc" xmlns="http://www.w3.org/2000/svg">
<title id="kwalificatie-title">Van zoekvraag naar passende vervolgstap</title>
<desc id="kwalificatie-desc">Een keten van zoekvraag naar probleemherkenning, bewijs en vervolgstap.</desc>
<rect x="20" y="70" width="200" height="90" rx="16" fill="none" stroke="currentColor"/><text x="120" y="122" text-anchor="middle">Zoekvraag</text>
<path d="M230 115 H300" stroke="currentColor" marker-end="url(#a1)"/>
<rect x="310" y="70" width="200" height="90" rx="16" fill="none" stroke="currentColor"/><text x="410" y="110" text-anchor="middle">Probleem-</text><text x="410" y="134" text-anchor="middle">herkenning</text>
<path d="M520 115 H590" stroke="currentColor" marker-end="url(#a1)"/>
<rect x="600" y="70" width="150" height="90" rx="16" fill="none" stroke="currentColor"/><text x="675" y="122" text-anchor="middle">Bewijs</text>
<path d="M760 115 H810" stroke="currentColor" marker-end="url(#a1)"/>
<rect x="820" y="70" width="120" height="90" rx="16" fill="none" stroke="currentColor"/><text x="880" y="110" text-anchor="middle">Volgende</text><text x="880" y="134" text-anchor="middle">stap</text>
<defs><marker id="a1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor"/></marker></defs>
</svg>
<figcaption>Organisch bereik levert pas commerciële waarde op als de hele kwalificatieketen klopt.</figcaption>
</figure>
<figure class="artikel-figuur">
<svg viewBox="0 0 960 240" role="img" aria-labelledby="leren-title leren-desc" xmlns="http://www.w3.org/2000/svg">
<title id="leren-title">Meet- en leerlus voor {safe_keyword}</title>
<desc id="leren-desc">Een gesloten lus van hypothese, publiceren, meten, leren en aanpassen.</desc>
<rect x="40" y="70" width="150" height="90" rx="16" fill="none" stroke="currentColor"/><text x="115" y="122" text-anchor="middle">Hypothese</text>
<path d="M200 115 H270" stroke="currentColor" marker-end="url(#a2)"/>
<rect x="280" y="70" width="150" height="90" rx="16" fill="none" stroke="currentColor"/><text x="355" y="122" text-anchor="middle">Publiceren</text>
<path d="M440 115 H510" stroke="currentColor" marker-end="url(#a2)"/>
<rect x="520" y="70" width="150" height="90" rx="16" fill="none" stroke="currentColor"/><text x="595" y="122" text-anchor="middle">Meten</text>
<path d="M680 115 H750" stroke="currentColor" marker-end="url(#a2)"/>
<rect x="760" y="70" width="150" height="90" rx="16" fill="none" stroke="currentColor"/><text x="835" y="110" text-anchor="middle">Leren &amp;</text><text x="835" y="134" text-anchor="middle">aanpassen</text>
<path d="M835 170 C835 220 115 220 115 170" fill="none" stroke="currentColor" marker-end="url(#a2)"/>
<defs><marker id="a2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor"/></marker></defs>
</svg>
<figcaption>Leg vooraf vast wat je verwacht en gebruik de gemeten uitkomst om de volgende publicatie te verbeteren.</figcaption>
</figure>
</div>'''


def enrich_article(html_doc, q):
    faqs = faq_items(q['blogtext'])
    if len(faqs) < 2:
        base.fail('Approved blog vereist minimaal twee FAQ-regels voor FAQPage schema')

    schema_match = re.search(r'<script type="application/ld\+json">(.*?)</script>', html_doc, re.S)
    if not schema_match:
        base.fail('Blogoutput mist JSON-LD voor FAQ-verrijking')
    schema = json.loads(schema_match.group(1))
    graph = schema.get('@graph')
    if not isinstance(graph, list):
        base.fail('Blogoutput mist @graph voor FAQ-verrijking')
    graph.append({
        '@type': 'FAQPage',
        'mainEntity': [
            {
                '@type': 'Question',
                'name': question,
                'acceptedAnswer': {'@type': 'Answer', 'text': answer},
            }
            for question, answer in faqs
        ],
    })
    replacement = '<script type="application/ld+json">' + json.dumps(schema, ensure_ascii=False, separators=(',', ':')) + '</script>'
    html_doc = html_doc[:schema_match.start()] + replacement + html_doc[schema_match.end():]

    figures = article_figures(q['keyword'])
    close_article = '</article>'
    if close_article not in html_doc:
        base.fail('Blogoutput mist article-afsluiting voor figures')
    html_doc = html_doc.replace(close_article, figures + '\n' + close_article, 1)
    return html_doc


def normalize_performance(html_doc):
    remote_font_hosts = ('fonts.googleapis.com', 'fonts.gstatic.com')

    def strip_remote_font_link(match):
        tag = match.group(0)
        lowered = tag.lower()
        return '' if any(host in lowered for host in remote_font_hosts) else tag

    return re.sub(r'<link\b[^>]*>', strip_remote_font_link, html_doc, flags=re.I)


def instrument_content_id(html_doc, slug):
    content_id = f'blog:{slug}'
    if re.search(r'data-content-id=["\'][^"\']+["\']', html_doc):
        return re.sub(r'data-content-id=["\'][^"\']+["\']', f'data-content-id="{content_id}"', html_doc, count=1)
    if not re.search(r'<body(?:\s|>)', html_doc, re.I):
        base.fail('Blogtemplate mist body voor content_id-instrumentatie')
    return re.sub(r'<body(?=\s|>)', f'<body data-content-id="{content_id}"', html_doc, count=1, flags=re.I)


def render(force=''):
    if not force:
        base.fail('learning-driven selection required; render must receive an exact approved slug')
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', force):
        base.fail('Ongeldige geforceerde slug')
    row = get_queue(force)
    if not row:
        print('NO_ACTION: geen Pending Approved central article')
        return
    q = seal_or_validate(row)
    target = pathlib.Path('blog') / q['slug'] / 'index.html'
    if target.exists():
        base.fail('Doelslug bestaat al; verificatie vereist in plaats van tweede commit')
    if not base.TEMPLATE.exists():
        base.fail(f'Template ontbreekt: {base.TEMPLATE}')
    target.parent.mkdir(parents=True, exist_ok=True)
    html_doc = base.article(base.TEMPLATE.read_text(encoding='utf-8'), q)
    html_doc = enrich_article(html_doc, q)
    html_doc = normalize_performance(html_doc)
    target.write_text(instrument_content_id(html_doc, q['slug']), encoding='utf-8')
    base.updates(q)
    print(json.dumps({'status': 'RENDERED', 'slug': q['slug'], 'content_id': q['source'], 'growth_content_id': f"blog:{q['slug']}", 'command_id': q['cmd'], 'source_hash': q['source_hash'], 'queue_page': q['page'], 'dispatch_attempt': q['attempt'] + 1}, ensure_ascii=False))


def mark_dispatched(page_id, attempt, run_id=''):
    if not re.fullmatch(r'[0-9a-f-]{32,36}', page_id):
        base.fail('Ongeldige queue page-id')
    props = {
        'Dispatch status': {'select': {'name': 'Dispatched'}},
        'Dispatch attempt': {'number': int(attempt)},
        'Dispatched At': {'date': {'start': dt.datetime.now(dt.timezone.utc).isoformat()}},
    }
    if run_id:
        props['GitHub Run ID'] = {'rich_text': [{'type': 'text', 'text': {'content': str(run_id)}}]}
    base.req(f'/pages/{page_id}', 'PATCH', {'properties': props})
    print('DISPATCHED_MARKED')


def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--list-candidates':
        list_candidates(); return
    if len(sys.argv) > 1 and sys.argv[1] == '--select-due-slug':
        select_due_slug(); return
    if len(sys.argv) > 1 and sys.argv[1] == '--mark-dispatched':
        if len(sys.argv) < 4:
            base.fail('Gebruik --mark-dispatched <page_id> <attempt> [run_id]')
        mark_dispatched(sys.argv[2], sys.argv[3], sys.argv[4] if len(sys.argv) > 4 else '')
        return
    render(sys.argv[1].strip() if len(sys.argv) > 1 else '')


if __name__ == '__main__':
    main()
