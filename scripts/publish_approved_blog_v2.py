#!/usr/bin/env python3
import hashlib
import json
import pathlib
import re
import sys

import publish_approved_blog as base


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


def actual_hash(q):
    payload = '\n'.join([q['source'], q['slug'], q['title'], q['keyword'], q['meta'], q['blogtext']])
    return hashlib.sha256(payload.encode()).hexdigest()


def seal_or_validate(row):
    q = snapshot_from_row(row)
    actual = actual_hash(q)
    if q['source_hash'] == 'PENDING_SEAL':
        base.req(f"/pages/{q['page']}", 'PATCH', {
            'properties': {
                'Approved Source Hash': {
                    'rich_text': [{'type': 'text', 'text': {'content': actual}}]
                }
            }
        })
        print(f'SEALED:{actual}')
        return None
    if q['source_hash'] != actual:
        base.fail('Approved Source Hash mismatch; snapshot is gewijzigd na sealing')
    return q


def render(force=''):
    if force and not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', force):
        base.fail('Ongeldige geforceerde slug')
    row = base.get_queue(force)
    if not row:
        print('NO_ACTION: geen Pending Approved central article')
        return
    sealed = seal_or_validate(row)
    if sealed is None:
        return
    q = base.queue_contract(row)
    target = pathlib.Path('blog') / q['slug'] / 'index.html'
    if target.exists():
        base.fail('Doelslug bestaat al; verificatie vereist in plaats van tweede commit')
    if not base.TEMPLATE.exists():
        base.fail(f'Template ontbreekt: {base.TEMPLATE}')
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(base.article(base.TEMPLATE.read_text(encoding='utf-8'), q), encoding='utf-8')
    base.updates(q)
    print(json.dumps({
        'status': 'RENDERED',
        'slug': q['slug'],
        'content_id': q['source'],
        'command_id': q['cmd'],
        'source_hash': q['source_hash'],
        'queue_page': q['page'],
        'dispatch_attempt': q['attempt'] + 1,
    }, ensure_ascii=False))


def mark_dispatched(page_id, attempt, run_id=''):
    if not re.fullmatch(r'[0-9a-f-]{32,36}', page_id):
        base.fail('Ongeldige queue page-id')
    props = {
        'Dispatch status': {'select': {'name': 'Dispatched'}},
        'Dispatch attempt': {'number': int(attempt)},
    }
    if run_id:
        props['GitHub Run ID'] = {'rich_text': [{'type': 'text', 'text': {'content': str(run_id)}}]}
    base.req(f'/pages/{page_id}', 'PATCH', {'properties': props})
    print('DISPATCHED_MARKED')


def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--mark-dispatched':
        if len(sys.argv) < 4:
            base.fail('Gebruik --mark-dispatched <page_id> <attempt> [run_id]')
        mark_dispatched(sys.argv[2], sys.argv[3], sys.argv[4] if len(sys.argv) > 4 else '')
        return
    render(sys.argv[1].strip() if len(sys.argv) > 1 else '')


if __name__ == '__main__':
    main()
