const API_URL = '/intern/api/linkedin-revenue';
const laneIds = ['today', 'inbox', 'connections', 'posts', 'followUp', 'revenue'];
let model = null;

const el = id => document.getElementById(id);
function setText(id, value) { const node = el(id); if (node) node.textContent = String(value ?? '—'); }
function switchLane(lane) { if (!laneIds.includes(lane)) return; document.querySelectorAll('[data-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.panel === lane)); document.querySelectorAll('[data-lane]').forEach(button => button.classList.toggle('active', button.dataset.lane === lane)); }
document.querySelectorAll('[data-lane]').forEach(button => button.addEventListener('click', () => switchLane(button.dataset.lane)));
function node(tag, className, text) { const result = document.createElement(tag); if (className) result.className = className; if (text !== undefined) result.textContent = text; return result; }
function safeExternalLink(url, label, primary = false) { if (!/^https:\/\//i.test(url || '')) return null; const link = node('a', `linkbtn${primary ? ' primary' : ''}`, label); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; return link; }
function money(value) { const number = Number(value || 0); if (!number) return ''; return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(number); }

async function recordOutcome(action, outcomeType, revenueEur = 0) {
  if (!action?.actionId) throw new Error('Actie-id ontbreekt');
  const response = await fetch(API_URL, { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ actionId: action.actionId, outcomeType, revenueEur }) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.reason || body.status || `HTTP ${response.status}`);
  return body;
}

function outcomeButton(action, label, outcomeType, { revenue = false } = {}) {
  const button = node('button', 'btn', label);
  button.type = 'button';
  button.addEventListener('click', async () => {
    button.disabled = true;
    const original = button.textContent;
    button.textContent = 'Opslaan…';
    try {
      let revenueEur = 0;
      if (revenue) {
        const raw = window.prompt('Order-/omzetwaarde in euro (optioneel)', action.expectedValue ? String(action.expectedValue) : '');
        revenueEur = Number(String(raw || '').replace(/[^0-9,.-]/g, '').replace(',', '.')) || 0;
      }
      await recordOutcome(action, outcomeType, revenueEur);
      button.textContent = 'Vastgelegd ✓';
      setTimeout(loadCockpit, 500);
    } catch (error) {
      button.textContent = 'Mislukt';
      button.title = String(error?.message || error);
      setTimeout(() => { button.textContent = original; button.disabled = false; }, 1800);
    }
  });
  return button;
}

function renderCard(action) {
  const card = node('article', 'card');
  const top = node('div', 'cardtop');
  const who = node('div', 'who');
  who.append(node('h3', '', action.person || 'Onbekende connectie'));
  who.append(node('p', '', [action.role, action.company].filter(Boolean).join(' · ') || 'Relatie uit Powerhouse'));
  top.append(who, node('div', 'score', String(action.score ?? 0)));
  card.append(top);

  const tags = node('div', 'tags');
  tags.append(node('span', 'tag', action.channel || 'LinkedIn'));
  tags.append(node('span', `tag ${action.contextState === 'ready' ? 'ready' : 'blocked'}`, action.contextState === 'ready' ? '✓ Tekst klaar' : '⚠ Context nodig'));
  if (action.proposition) tags.append(node('span', 'tag', action.proposition));
  if (action.expectedValue) tags.append(node('span', 'tag', money(action.expectedValue)));
  card.append(tags);

  const why = node('div', 'why');
  why.append(node('b', '', 'Waarom nu'));
  why.append(node('p', '', action.whyNow || action.nextAction || 'Evidence-backed actie uit Powerhouse.'));
  card.append(why);

  const draft = node('div', `draft ${action.contextState === 'ready' ? 'ready' : 'blocked'}`);
  if (action.contextState === 'ready' && action.readyText) {
    draft.append(node('b', '', 'Voorgestelde tekst'));
    draft.append(node('p', '', action.readyText));
  } else {
    draft.append(node('b', '', 'Context aanvullen'));
    draft.append(node('p', '', action.nextAction || 'Open de concrete bron en lees eerst de post of laatste boodschap. Geen tekst zonder bewijs.'));
  }
  card.append(draft);

  const buttons = node('div', 'cardactions');
  const openUrl = action.sourceUrl && action.sourceUrl !== 'https://www.linkedin.com/feed/' ? action.sourceUrl : action.linkedinUrl;
  const open = safeExternalLink(openUrl, action.source === 'posts' ? 'Open post ↗' : 'Open bron ↗', true);
  if (open) buttons.append(open);

  if (action.contextState === 'ready' && action.readyText) {
    const copy = node('button', 'btn', 'Kopieer tekst');
    copy.type = 'button';
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(action.readyText); copy.textContent = 'Gekopieerd ✓'; setTimeout(() => { copy.textContent = 'Kopieer tekst'; }, 1600); }
      catch { copy.textContent = 'Kopiëren mislukt'; }
    });
    buttons.append(copy);
  }

  if (action.actionId) {
    buttons.append(outcomeButton(action, 'Uitgevoerd', 'executed'));
    buttons.append(outcomeButton(action, 'Reactie', 'reply_received'));
    buttons.append(outcomeButton(action, 'Gesprek', 'meeting_booked'));
    buttons.append(outcomeButton(action, 'Offerte', 'offer_created'));
    buttons.append(outcomeButton(action, 'Order', 'order_won', { revenue: true }));
  }
  card.append(buttons);
  return card;
}

function emptyState(container, lane) { const box = node('div', 'empty'); box.append(node('strong', '', lane === 'posts' ? 'Nog geen concrete postkansen' : 'Geen acties in deze lane')); box.append(node('span', '', lane === 'posts' ? 'Alleen evidence-backed concrete posts verschijnen hier.' : 'Deze lane blijft leeg totdat de kern een evidence-backed actie oplevert.')); container.append(box); }
function renderLane(lane, actions = []) { const container = el(lane); if (!container) return; container.replaceChildren(); if (!actions.length) return emptyState(container, lane); actions.forEach(action => container.append(renderCard(action))); }
function applyModel(data) { model = data; const summary = data.summary || {}; setText('mToday', summary.today ?? 0); setText('mWaiting', summary.waitingOnMe ?? 0); setText('mReady', summary.sendReady ?? 0); setText('mContext', summary.contextRequired ?? 0); setText('mPosts', summary.groundedPosts ?? 0); setText('statusText', data.status === 'READY' ? 'Powerhouse kern live' : 'Deels beschikbaar'); const dot = el('statusDot'); if (dot) dot.className = `dot ${data.status === 'READY' ? 'ok' : 'warn'}`; const lanes = data.lanes || {}; for (const lane of laneIds) renderLane(lane, Array.isArray(lanes[lane]) ? lanes[lane] : []); }
function showError(message) { setText('statusText', 'Data niet beschikbaar'); const dot = el('statusDot'); if (dot) dot.className = 'dot warn'; const container = el('today'); if (!container) return; container.replaceChildren(); const error = node('div', 'errorbox'); error.append(node('strong', '', 'Cockpitdata kon niet veilig worden geladen.')); error.append(node('div', '', message || 'Powerhouse Unified Core is niet bereikbaar.')); container.append(error); for (const lane of laneIds.filter(item => item !== 'today')) renderLane(lane, []); }

async function loadCockpit() {
  const refresh = el('refresh'); if (refresh) { refresh.disabled = true; refresh.textContent = 'Laden…'; }
  try {
    const response = await fetch(API_URL, { method: 'GET', credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.reason || body.status || `HTTP ${response.status}`);
    if (body.schemaVersion !== 'linkedin-revenue-cockpit-v2-unified-core') throw new Error('Onverwacht datacontract');
    applyModel(body);
  } catch (error) { showError(String(error?.message || 'Onbekende fout')); }
  finally { if (refresh) { refresh.disabled = false; refresh.textContent = '↻ Vernieuwen'; } }
}

el('refresh')?.addEventListener('click', loadCockpit);
loadCockpit();
