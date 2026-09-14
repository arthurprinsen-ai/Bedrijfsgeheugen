#!/usr/bin/env python3
import datetime as dt
import hashlib
import html as html_lib
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


def _normalized_source(raw):
    return raw.replace('\r\n', '\n').replace('<br><br>', '\n\n').replace('<br>', '\n')


def _plain_source(raw):
    text = _normalized_source(raw)
    text = re.sub(r'\[([^\]]+)\]\((?:https?://[^)]+)\)', r'\1', text)
    text = re.sub(r'[*_`#]+', ' ', text)
    text = re.sub(r'FAQ:\s*', ' ', text, flags=re.I)
    text = text.replace('||', ' ')
    return re.sub(r'\s+', ' ', text).strip()


def extract_h2(raw):
    return [m.group(1).strip() for m in re.finditer(r'(?m)^##\s+(.+?)\s*$', _normalized_source(raw))]


def extract_faq(raw):
    faqs = []
    for line in _normalized_source(raw).splitlines():
        line = line.strip()
        if not line.lower().startswith('faq:'):
            continue
        value = line[4:].strip()
        parts = re.split(r'\s*\|\|\s*', value, maxsplit=1)
        if len(parts) != 2 or not all(part.strip() for part in parts):
            base.fail('FAQ-regel moet exact `FAQ: vraag || antwoord` bevatten')
        faqs.append((parts[0].strip(), parts[1].strip()))
    return faqs


def release_contract(q):
    title = q['title'].strip()
    keyword = q['keyword'].strip()
    meta = q['meta'].strip()
    raw = q['blogtext']
    kw = keyword.casefold()
    if not 1 <= len(title) <= 60:
        base.fail(f'Approved titel moet 1-60 tekens zijn; nu {len(title)}')
    if not 140 <= len(meta) <= 160:
        base.fail(f'Approved meta moet 140-160 tekens zijn; nu {len(meta)}')
    if kw not in title.casefold():
        base.fail('Focus-zoekwoord ontbreekt in approved titel')
    if kw not in meta.casefold():
        base.fail('Focus-zoekwoord ontbreekt in approved meta')
    first100 = ' '.join(_plain_source(raw).split()[:100]).casefold()
    if kw not in first100:
        base.fail('Focus-zoekwoord ontbreekt in eerste 100 woorden van approved bron')
    headings = extract_h2(raw)
    if len(headings) < 4:
        base.fail('Approved bron vereist minimaal vier H2-koppen voor leesstructuur en figures')
    if not any(kw in heading.casefold() for heading in headings):
        base.fail('Focus-zoekwoord ontbreekt in approved H2')
    faqs = extract_faq(raw)
    if len(faqs) < 2:
        base.fail('Approved bron vereist minimaal twee expliciete FAQ-regels')
    return {'headings': headings, 'faqs': faqs}


def _figure(title, labels):
    labels = [label for label in labels if label][:3]
    while len(labels) < 3:
        labels.append('Volgende stap')
    safe_title = html_lib.escape(title)
    safe = [html_lib.escape(label[:58]) for label in labels]
    return f'''<figure class="blog-structure-figure">
<svg role="img" viewBox="0 0 720 190" xmlns="http://www.w3.org/2000/svg" aria-labelledby="fig-{hashlib.sha1(title.encode()).hexdigest()[:10]}">
<title id="fig-{hashlib.sha1(title.encode()).hexdigest()[:10]}">{safe_title}</title>
<rect x="20" y="45" width="200" height="80" rx="12" fill="#F4F3EF" stroke="#14171A"/><text x="120" y="82" text-anchor="middle" font-size="15" font-family="sans-serif">{safe[0]}</text>
<path d="M225 85 H255" stroke="#2742D6" stroke-width="3"/><path d="M248 77 L258 85 L248 93" fill="none" stroke="#2742D6" stroke-width="3"/>
<rect x="260" y="45" width="200" height="80" rx="12" fill="#F4F3EF" stroke="#14171A"/><text x="360" y="82" text-anchor="middle" font-size="15" font-family="sans-serif">{safe[1]}</text>
<path d="M465 85 H495" stroke="#2742D6" stroke-width="3"/><path d="M488 77 L498 85 L488 93" fill="none" stroke="#2742D6" stroke-width="3"/>
<rect x="500" y="45" width="200" height="80" rx="12" fill="#F4F3EF" stroke="#14171A"/><text x="600" y="82" text-anchor="middle" font-size="15" font-family="sans-serif">{safe[2]}</text>
</svg>
<figcaption>{safe_title}</figcaption>
</figure>'''


def enhance_release_contract(html_text, q):
    evidence = release_contract(q)
    headings = evidence['headings']
    faqs = evidence['faqs']

    faq_items = ''.join(
        f'<div class="faq-item"><h3>{html_lib.escape(question)}</h3><p>{html_lib.escape(answer)}</p></div>'
        for question, answer in faqs
    )
    html_text = re.sub(r'<p>FAQ:\s*.*?\s*\|\|\s*.*?</p>', '', html_text, flags=re.I | re.S)
    faq_section = f'<section class="faq-blok" aria-labelledby="faq-heading"><h2 id="faq-heading">Veelgestelde vragen</h2>{faq_items}</section>'
    html_text = re.sub(r'<h2>Veelgestelde vragen</h2>', '', html_text, count=1, flags=re.I)

    split = max(2, len(headings) // 2)
    figure_one = _figure('Van zoekvraag naar herkenning en vervolgstap', headings[:3])
    figure_two = _figure('Van diagnose naar meten en leren', headings[split:split + 3])
    insert = figure_one + figure_two + faq_section
    if '</article>' not in html_text:
        base.fail('Gerenderd artikel mist </article> voor release-enrichment')
    html_text = html_text.replace('</article>', insert + '</article>', 1)

    ld_match = re.search(r'<script type="application/ld\+json">(.*?)</script>', html_text, re.I | re.S)
    if not ld_match:
        base.fail('Gerenderd artikel mist JSON-LD voor FAQPage-enrichment')
    try:
        ld = json.loads(ld_match.group(1))
    except Exception as exc:
        base.fail(f'Gerenderd JSON-LD is ongeldig: {exc}')
    if not isinstance(ld, dict):
        base.fail('Gerenderd JSON-LD moet een object zijn')
    graph = ld.get('@graph')
    if not isinstance(graph, list):
        graph = []
        ld['@graph'] = graph
    graph[:] = [node for node in graph if not (isinstance(node, dict) and node.get('@type') == 'FAQPage')]
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
    enriched_ld = '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False, separators=(',', ':')) + '</script>'
    html_text = html_text[:ld_match.start()] + enriched_ld + html_text[ld_match.end():]
    return html_text


def list_candidates():
    candidates=[]
    for row in get_rows('',100):
        q=queue_contract(row)
        release_contract(q)
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


def instrument_content_id(html, slug):
    content_id = f'blog:{slug}'
    if re.search(r'data-content-id=["\'][^"\']+["\']', html):
        return re.sub(r'data-content-id=["\'][^"\']+["\']', f'data-content-id="{content_id}"', html, count=1)
    if not re.search(r'<body(?:\s|>)', html, re.I):
        base.fail('Blogtemplate mist body voor content_id-instrumentatie')
    return re.sub(r'<body(?=\s|>)', f'<body data-content-id="{content_id}"', html, count=1, flags=re.I)


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
    release_contract(q)
    target = pathlib.Path('blog') / q['slug'] / 'index.html'
    if target.exists():
        base.fail('Doelslug bestaat al; verificatie vereist in plaats van tweede commit')
    if not base.TEMPLATE.exists():
        base.fail(f'Template ontbreekt: {base.TEMPLATE}')
    target.parent.mkdir(parents=True, exist_ok=True)
    html = base.article(base.TEMPLATE.read_text(encoding='utf-8'), q)
    html = enhance_release_contract(html, q)
    target.write_text(instrument_content_id(html, q['slug']), encoding='utf-8')
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
    if len(sys.argv) > 1 and sys.argv[1] == '--mark-dispatched':
        if len(sys.argv) < 4:
            base.fail('Gebruik --mark-dispatched <page_id> <attempt> [run_id]')
        mark_dispatched(sys.argv[2], sys.argv[3], sys.argv[4] if len(sys.argv) > 4 else '')
        return
    render(sys.argv[1].strip() if len(sys.argv) > 1 else '')


if __name__ == '__main__':
    main()
