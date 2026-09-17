#!/usr/bin/env python3
import html
import json
import pathlib
import re
import subprocess

import publish_approved_blog_v2_core as core
from publish_approved_blog_v2_core import *

# Static delivery contracts retained for existing gates:
# --select-due-slug
# learning-driven selection required; render must receive an exact approved slug


def select_due_slug():
    """Select the first due article that still needs a new artifact.

    A stale Pending row whose article already exists must not block later due
    work. Exact stale recovery remains available by forcing that slug through
    render(), where identity is verified before any distribution repair.
    """
    rows = core.get_rows('', 100)
    if not rows:
        print('NO_DUE_BLOG')
        return None

    for row in rows:
        q = core.queue_contract(row)
        target = pathlib.Path('blog') / q['slug'] / 'index.html'
        if target.exists():
            print(
                f"STALE_QUEUE_ALREADY_IN_MAIN:{q['slug']}: "
                "skipped by scheduler; use exact-slug recovery for reconciliation",
                file=core.sys.stderr,
            )
            continue
        print(q['slug'])
        return q['slug']

    print('NO_DUE_BLOG')
    return None


def actual_hash(q):
    return core.actual_hash(q)


def _validate_existing_article(target, q):
    existing = target.read_text(encoding='utf-8')
    title = html.escape(q['title'])
    canonical = f"https://www.bedrijfsgeheugen.nl/blog/{q['slug']}/"
    content_id = f"blog:{q['slug']}"

    if f'<title>{title}</title>' not in existing:
        core.base.fail('Bestaande doelslug heeft afwijkende title; fail-closed')
    h1 = re.search(r'<h1(?:\s[^>]*)?>(.*?)</h1>', existing, re.I | re.S)
    actual_h1 = html.unescape(re.sub(r'<[^>]+>', '', h1.group(1))).strip() if h1 else ''
    if actual_h1 != q['title']:
        core.base.fail('Bestaande doelslug heeft afwijkende h1; fail-closed')
    if f'<link rel="canonical" href="{canonical}">' not in existing:
        core.base.fail('Bestaande doelslug heeft afwijkende canonical; fail-closed')
    if f'data-content-id="{content_id}"' not in existing:
        core.base.fail('Bestaande doelslug heeft afwijkende content-id; fail-closed')


def _repo_has_changes():
    tracked = subprocess.run(['git', 'diff', '--quiet'], check=False).returncode != 0
    untracked = bool(
        subprocess.check_output(
            ['git', 'ls-files', '--others', '--exclude-standard'], text=True
        ).strip()
    )
    return tracked or untracked


def render(force=''):
    """Render a new article or idempotently reconcile an exact stale article."""
    if not force:
        core.base.fail('learning-driven selection required; render must receive an exact approved slug')
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', force):
        core.base.fail('Ongeldige geforceerde slug')

    row = core.get_queue(force)
    if not row:
        print('NO_ACTION: geen Pending Approved central article')
        return

    q = core.seal_or_validate(row)
    target = pathlib.Path('blog') / q['slug'] / 'index.html'
    status = 'RENDERED'

    if target.exists():
        _validate_existing_article(target, q)
        status = 'RECONCILED'
    else:
        if not core.base.TEMPLATE.exists():
            core.base.fail(f'Template ontbreekt: {core.base.TEMPLATE}')
        target.parent.mkdir(parents=True, exist_ok=True)
        html_doc = core.base.article(core.base.TEMPLATE.read_text(encoding='utf-8'), q)
        html_doc = core.enrich_article(html_doc, q)
        html_doc = core.normalize_performance(html_doc)
        target.write_text(core.instrument_content_id(html_doc, q['slug']), encoding='utf-8')

    # Reuse the canonical distribution updater. It is idempotent: only missing
    # blog-index/RSS/sitemap entries are materialized.
    core.base.updates(q)

    if status == 'RECONCILED' and not _repo_has_changes():
        print(f"SEALED:{q['slug']}")
        return

    print(json.dumps({
        'status': status,
        'slug': q['slug'],
        'content_id': q['source'],
        'growth_content_id': f"blog:{q['slug']}",
        'command_id': q['cmd'],
        'source_hash': q['source_hash'],
        'queue_page': q['page'],
        'dispatch_attempt': q['attempt'] + 1,
    }, ensure_ascii=False))


core.select_due_slug = select_due_slug
core.render = render


if __name__ == '__main__':
    core.main()
