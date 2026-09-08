import {
  basicAuthMatches,
  buildPriorityQueue,
  normalizeCommentPage,
  normalizeConnectionPage,
  normalizeDmPage,
  normalizeUnansweredPage
} from '../../platform/linkedin-revenue-cockpit.mjs';

const NOTION_VERSION = '2025-09-03';
const SOURCES = Object.freeze({
  connections: '3b2da36a-ac8a-80f1-a78d-000b4766fd4c',
  unanswered: '3b2da36a-ac8a-80c4-a392-000b0f6d3b2f',
  comments: '0c7f1516-1e2f-42f9-9f15-4b0081de8e7a',
  dms: 'b3a5793e-b314-4faa-90e2-d1357f23804e'
});

const secureHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'private, no-store, max-age=0',
  'Pragma': 'no-cache',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer'
};

function response(statusCode, payload, extraHeaders = {}) {
  return { statusCode, headers: { ...secureHeaders, ...extraHeaders }, body: JSON.stringify(payload) };
}

async function queryDataSource(token, dataSourceId, body = {}) {
  const result = await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION
    },
    body: JSON.stringify({ page_size: 100, ...body }),
    signal: AbortSignal.timeout(9000)
  });
  if (!result.ok) {
    const error = await result.json().catch(() => ({}));
    const safeCode = error?.code || `HTTP_${result.status}`;
    throw new Error(`NOTION_${safeCode}`);
  }
  const json = await result.json();
  return Array.isArray(json.results) ? json.results : [];
}

async function safeQuery(name, token, dataSourceId, body) {
  try {
    const rows = await queryDataSource(token, dataSourceId, body);
    return { name, ok: true, rows, count: rows.length };
  } catch (error) {
    return { name, ok: false, rows: [], count: 0, error: String(error?.message || 'NOTION_QUERY_FAILED') };
  }
}

function compactAction(action) {
  return {
    id: action.id,
    person: action.person,
    company: action.company || '',
    role: action.role || '',
    linkedinUrl: action.linkedinUrl || '',
    sourceUrl: action.sourceUrl || '',
    channel: action.channel || 'LinkedIn DM',
    whyNow: action.whyNow || '',
    nextAction: action.nextAction || 'Context aanvullen',
    readyText: action.sendReady ? action.readyText : '',
    contextState: action.sendReady ? 'ready' : 'context_required',
    score: action.score || 0,
    confidence: action.confidence || 0,
    expectedValue: action.expectedValue || 0,
    proposition: action.proposition || '',
    email: action.email || '',
    source: action.source || ''
  };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return response(204, {});
  if (event.httpMethod !== 'GET') return response(405, { status: 'METHOD_NOT_ALLOWED' }, { Allow: 'GET' });

  const user = process.env.INTERN_GEBRUIKER || '';
  const password = process.env.INTERN_WACHTWOORD || '';
  const authorization = event.headers?.authorization || event.headers?.Authorization || '';
  if (!basicAuthMatches(authorization, user, password)) {
    return response(401, { status: 'UNAUTHORIZED' }, {
      'WWW-Authenticate': 'Basic realm="Intern - Bedrijfsgeheugen", charset="UTF-8"'
    });
  }

  const token = process.env.NOTION_TOKEN || '';
  if (!token) {
    return response(503, {
      status: 'CAPABILITY_UNAVAILABLE',
      reason: 'NOTION_TOKEN_NOT_CONFIGURED',
      sourceHealth: Object.fromEntries(Object.keys(SOURCES).map(name => [name, { ok: false }]))
    });
  }

  const [connectionsResult, unansweredResult, commentsResult, dmsResult] = await Promise.all([
    safeQuery('connections', token, SOURCES.connections, {
      filter: {
        or: [
          { property: 'Drive Status', select: { equals: 'Nu' } },
          { property: 'Bal ligt bij', select: { equals: 'Zij wachten op mij' } },
          { property: 'Prioriteit', select: { equals: '1 — Nu' } }
        ]
      }
    }),
    safeQuery('unanswered', token, SOURCES.unanswered, {
      filter: { property: 'Bal ligt bij', select: { equals: 'Zij wachten op mij' } }
    }),
    safeQuery('comments', token, SOURCES.comments, {
      filter: { property: 'Status', select: { does_not_equal: 'Geen match' } }
    }),
    safeQuery('dms', token, SOURCES.dms, {
      filter: { property: 'Status', select: { does_not_equal: 'Vervallen' } }
    })
  ]);

  const sourceResults = [connectionsResult, unansweredResult, commentsResult, dmsResult];
  const sourceHealth = Object.fromEntries(sourceResults.map(item => [item.name, {
    ok: item.ok,
    count: item.count,
    ...(item.ok ? {} : { error: item.error })
  }]));

  if (!sourceResults.some(item => item.ok)) {
    return response(503, { status: 'SOURCES_UNAVAILABLE', sourceHealth });
  }

  const connections = connectionsResult.rows.map(normalizeConnectionPage).filter(item => item.person && item.linkedinUrl);
  const connectionsById = new Map(connections.map(item => [item.id, item]));
  const unanswered = unansweredResult.rows.map(normalizeUnansweredPage).filter(item => item.person && item.linkedinUrl);
  const comments = commentsResult.rows.map(normalizeCommentPage).filter(item => item.person && item.sourceUrl);
  const dms = dmsResult.rows.map(page => normalizeDmPage(page, connectionsById)).filter(item => item.person && item.linkedinUrl);

  const queue = buildPriorityQueue([...unanswered, ...connections, ...comments, ...dms], { limit: 12 }).map(compactAction);
  const posts = comments.filter(item => item.directPost).map(item => compactAction({ ...item, score: item.score || 0 })).slice(0, 20);
  const followUp = connections
    .filter(item => !item.waitingOnMe && (item.nextAction || item.driveStatus === 'Nu'))
    .map(item => compactAction({ ...item, score: item.score || 0 }))
    .slice(0, 20);

  return response(200, {
    schemaVersion: 'linkedin-revenue-cockpit-v1',
    generatedAt: new Date().toISOString(),
    status: sourceResults.every(item => item.ok) ? 'READY' : 'PARTIAL',
    maxActions: 12,
    sourceHealth,
    summary: {
      today: queue.length,
      waitingOnMe: unanswered.length,
      groundedPosts: posts.filter(item => item.contextState === 'ready').length,
      sendReady: queue.filter(item => item.contextState === 'ready').length,
      contextRequired: queue.filter(item => item.contextState !== 'ready').length
    },
    lanes: {
      today: queue,
      inbox: queue.filter(item => item.source === 'inbox' || item.source === 'dm'),
      connections: connections.slice(0, 30).map(item => compactAction({ ...item, score: item.score || 0 })),
      posts,
      followUp,
      revenue: queue.filter(item => item.expectedValue > 0 || item.proposition)
    }
  });
}
