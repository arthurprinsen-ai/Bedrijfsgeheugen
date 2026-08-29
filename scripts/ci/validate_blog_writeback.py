#!/usr/bin/env python3
import json
import re
import subprocess
import sys
from pathlib import Path

MANIFEST = Path('/tmp/validated-writeback-files.txt')


def git(*args):
    return subprocess.check_output(['git', *args], text=True).splitlines()


def fail(message):
    raise SystemExit(f'WRITEBACK_CONTRACT_VIOLATION: {message}')


def changed_paths():
    tracked = git('diff', '--name-only')
    untracked = git('ls-files', '--others', '--exclude-standard')
    return sorted(set(p for p in tracked + untracked if p))


def validate_article(path, slug, focus_keyword):
    text = Path(path).read_text(encoding='utf-8')
    if len(re.findall(r'<h1(?:\s|>)', text, re.I)) != 1:
        fail(f'{path}: exact één h1 vereist')

    canonical = re.search(
        r'<link\s+rel=["\']canonical["\']\s+href=["\']([^"\']+)["\']',
        text,
        re.I,
    )
    expected = f'https://www.bedrijfsgeheugen.nl/blog/{slug}/'
    if not canonical or canonical.group(1) != expected or '.html' in canonical.group(1):
        fail(f'{path}: canonical moet exact {expected} zijn')

    blocks = re.findall(
        r'<script\s+type=["\']application/ld\+json["\']>(.*?)</script>',
        text,
        re.I | re.S,
    )
    if not blocks:
        fail(f'{path}: JSON-LD ontbreekt')
    for block in blocks:
        try:
            json.loads(block)
        except json.JSONDecodeError as exc:
            fail(f'{path}: ongeldige JSON-LD: {exc}')

    if focus_keyword:
        marker = re.search(
            r'<meta\s+name=["\']bg-zoekwoord["\']\s+content=["\']([^"\']*)["\']',
            text,
            re.I,
        )
        if not marker or marker.group(1).strip() != focus_keyword.strip():
            fail(f'{path}: bg-zoekwoord wijkt af van de kalender')

    if re.search(r'href=["\']/[^"\']+\.html(?:[?#][^"\']*)?["\']', text, re.I):
        fail(f'{path}: interne .html-link gevonden')


def main():
    if len(sys.argv) < 3 or sys.argv[1] not in {'publish', 'update'}:
        fail('gebruik: validate_blog_writeback.py publish|update SLUG [FOCUS_KEYWORD]')

    mode, slug = sys.argv[1], sys.argv[2]
    focus = sys.argv[3] if len(sys.argv) > 3 else ''
    target = f'blog/{slug}/index.html'
    changed = changed_paths()
    if not changed:
        fail('geen wijzigingen gevonden')

    status = git('diff', '--name-status')
    if any(line.startswith(('D', 'R', 'C')) for line in status):
        fail(f'verwijderen/hernoemen/kopiëren niet toegestaan: {status}')

    if mode == 'publish':
        required = {target, 'blog/index.html', 'blog/rss.xml', 'sitemap.xml'}
        missing = sorted(required - set(changed))
        if missing:
            fail(f'verplichte publicatiebestanden ontbreken: {missing}')
        extras = [p for p in changed if p not in required]
    else:
        if target not in changed:
            fail(f'doelartikel niet gewijzigd: {target}')
        allowed_base = {target, 'sitemap.xml'}
        extras = [p for p in changed if p not in allowed_base]

    article_extra = [
        p
        for p in extras
        if re.fullmatch(r'blog/[a-z0-9-]+/index\.html', p) and p != target
    ]
    unexpected = [p for p in extras if p not in article_extra]
    if unexpected:
        fail(f'onverwachte bestanden gewijzigd: {unexpected}')
    if len(article_extra) > 1:
        fail(f'hooguit één pijler/backlink-artikel toegestaan: {article_extra}')

    validate_article(target, slug, focus)
    MANIFEST.write_text(''.join(f'{p}\n' for p in changed), encoding='utf-8')
    print('WRITEBACK_CONTRACT_OK', mode, changed)


if __name__ == '__main__':
    main()
