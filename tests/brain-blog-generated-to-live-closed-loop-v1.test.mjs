import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('daily blog GENERATED state has a repository-native hourly closed loop', async () => {
  const [workflow, queue, exporter, renderer] = await Promise.all([
    readFile('.github/workflows/powerhouse-daily-blog.yml','utf8'),
    readFile('supabase/functions/powerhouse-blog-queue/index.ts','utf8'),
    readFile('supabase/functions/powerhouse-blog-export/index.ts','utf8'),
    readFile('tools/site-shell/publish_powerhouse_blog_artifact.py','utf8')
  ]);

  assert.match(workflow, /cron: '11 \* \* \* \*'/);
  assert.match(workflow, /push:\s*\n\s*branches: \[main\]/);
  assert.match(workflow, /SAME_OBLIGATION_WRITER_ACTIVE/);
  assert.match(workflow, /automation\/powerhouse-blog-\$DATE/);
  assert.match(workflow, /gh pr merge "\$pr" --auto --squash/);

  const obligationWrite = queue.indexOf("record_content_publication_state");
  const decisionWrite = queue.indexOf("powerhouse_channel_decisions");
  const finalDecisionMutation = queue.indexOf(".update({delivery_evidence:evidence");
  assert.ok(obligationWrite > 0);
  assert.ok(finalDecisionMutation > obligationWrite, 'durable publication obligation must precede later decision evidence mutation');
  assert.match(queue, /idempotency_key:'content-publication:'\+runDate\+':blog'/);
  assert.match(queue, /next_executor:'\.github\/workflows\/powerhouse-daily-blog\.yml'/);

  assert.match(exporter, /content_publication_obligations/);
  assert.match(exporter, /obligation_idempotency_key/);
  assert.match(renderer, /urllib\.error\.HTTPError/);
  assert.match(renderer, /NO_ACTION:NO_APPROVED_BLOG_ARTIFACT/);
});
