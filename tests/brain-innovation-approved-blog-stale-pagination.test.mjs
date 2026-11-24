import { execFileSync } from 'node:child_process';
import test from 'node:test';

const fixture = String.raw`
import contextlib
import io
import os
from pathlib import Path
import sys
from tempfile import TemporaryDirectory
from unittest.mock import patch

sys.path.insert(0, str(Path('scripts').resolve()))
import publish_approved_blog_v2 as publisher

core = publisher.core

with TemporaryDirectory() as folder, contextlib.redirect_stderr(io.StringIO()):
    os.chdir(folder)
    stale = Path('blog/stale/index.html')
    stale.parent.mkdir(parents=True)
    existing = (
        '<title>Fixture</title><h1>Fixture</h1>'
        '<link rel="canonical" href="https://www.bedrijfsgeheugen.nl/blog/stale/">'
        '<main data-content-id="blog:stale"></main>'
    )
    stale.write_text(existing, encoding='utf-8')

    def page(path, method, body):
        assert method == 'POST' and path.endswith('/query')
        assert body['page_size'] == 100
        if 'start_cursor' not in body:
            return {'results': [{'slug': 'stale'}], 'has_more': True, 'next_cursor': 'page-two'}
        assert body['start_cursor'] == 'page-two'
        return {'results': [{'slug': 'fresh'}], 'has_more': False}

    mode = os.environ.get('POWERHOUSE_LEARNING_EVAL_MODE')
    output = io.StringIO()
    with contextlib.redirect_stdout(output):
        if mode == 'SHADOW':
            with patch.object(core, 'get_queue', return_value={'slug': 'stale'}) as lookup, \
                 patch.object(core, 'seal_or_validate', return_value={'slug': 'stale', 'title': 'Fixture'}), \
                 patch.object(core.base, 'updates') as updates, \
                 patch.object(core.base, 'req', side_effect=AssertionError('unexpected request')), \
                 patch.object(publisher, '_repo_has_changes', return_value=False):
                publisher.render('stale')
                lookup.assert_called_once_with('stale')
                updates.assert_called_once()
            assert output.getvalue().strip() == 'SEALED:stale'
            assert stale.read_text(encoding='utf-8') == existing
        else:
            with patch.object(core.base, 'req', side_effect=page) as request, \
                 patch.object(core, 'queue_contract', side_effect=lambda row: row):
                selected = publisher.select_due_slug()
            assert selected == 'fresh', repr(selected)
            assert output.getvalue().strip() == 'fresh'
            assert request.call_count == 2

            repeated_page = {'results': [], 'has_more': True, 'next_cursor': 'repeated'}
            with patch.object(core.base, 'req', return_value=repeated_page) as request:
                try:
                    publisher.select_due_slug()
                except SystemExit as error:
                    assert error.code == 1
                else:
                    raise AssertionError('repeated cursor must fail closed')
            assert request.call_count == 2

            forced_pages = [
                {'results': [{'slug': 'stale'}], 'has_more': True, 'next_cursor': 'second'},
                {'results': [{'slug': 'stale'}], 'has_more': True, 'next_cursor': 'third'},
            ]
            with patch.object(core.base, 'req', side_effect=forced_pages) as request:
                try:
                    core.get_queue('stale')
                except SystemExit as error:
                    assert error.code == 1
                else:
                    raise AssertionError('duplicate exact slug must fail closed')
            assert request.call_count == 2
`;

test('approved blog queue pagination and exact stale recovery', () => {
  execFileSync('python3', ['-B', '-c', fixture], { stdio: ['ignore', 'pipe', 'inherit'] });
});
