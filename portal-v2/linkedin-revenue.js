const MAX_ACTIONS = 12;
const list = document.getElementById('actions');
const empty = document.getElementById('emptyState');
const refresh = document.getElementById('refreshBtn');

function validLinkedInProfile(url='') {
  return /^https:\/\/www\.linkedin\.com\/in\//i.test(url);
}

function isConcreteSource(url='') {
  return Boolean(url) && !/^https:\/\/(www\.)?linkedin\.com\/feed\/?$/i.test(url);
}

function safeAction(action={}) {
  const grounded = Boolean(action.person && action.channel && action.contextEvidence && isConcreteSource(action.sourceUrl || action.linkedinUrl));
  return {
    ...action,
    score: Math.max(0, Math.min(100, Number(action.score) || 0)),
    readyText: grounded ? String(action.readyText || '') : '',
    status: grounded ? 'ready' : 'context_required'
  };
}

function render(actions=[]) {
  const queue = actions.slice(0, MAX_ACTIONS).map(safeAction);
  list.innerHTML = '';
  empty.hidden = queue.length > 0;
  for (const action of queue) {
    const card = document.createElement('article');
    card.className = 'action-card';
    const profile = validLinkedInProfile(action.linkedinUrl) ? action.linkedinUrl : '';
    const text = action.status === 'ready' ? action.readyText : '';
    card.innerHTML = `
      <div>
        <div class="action-meta"><span class="pill">${action.channel || 'Kanaal onbekend'}</span><span>${action.company || ''}</span><span>${action.role || ''}</span></div>
        <h3>${action.person || 'Context aanvullen'}</h3>
        <p>${action.whyNow || (action.status === 'ready' ? 'Evidence-backed actie' : 'Context ontbreekt: vul eerst concrete bron en gesprekssituatie aan.')}</p>
        ${text ? `<blockquote>${text}</blockquote>` : '<p><strong>Geen tekst zonder bewijs.</strong></p>'}
        <div class="action-buttons">
          ${profile ? `<a class="go" href="${profile}" target="_blank" rel="noopener noreferrer">Open LinkedIn</a>` : ''}
          <button type="button" data-copy="${encodeURIComponent(text)}" ${text ? '' : 'disabled'}>Kopieer tekst</button>
          <button type="button">Markeer uitgevoerd</button>
          ${action.status === 'context_required' ? '<button type="button">Context aanvullen</button>' : ''}
        </div>
      </div>
      <div class="score">${action.score}/100</div>`;
    list.appendChild(card);
  }
}

async function load() {
  try {
    const response = await fetch('./linkedin-revenue-data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    render(Array.isArray(data.actions) ? data.actions : []);
  } catch (error) {
    render([]);
    const rule = empty?.querySelector('.rule');
    if (rule) rule.textContent = 'Cockpitdata kon niet veilig worden gelezen. Er wordt niets send-ready gemaakt.';
  }
}

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-copy]');
  if (!button || button.disabled) return;
  const text = decodeURIComponent(button.dataset.copy || '');
  if (!text) return;
  await navigator.clipboard.writeText(text);
  const original = button.textContent;
  button.textContent = 'Gekopieerd';
  setTimeout(() => { button.textContent = original; }, 1200);
});

refresh?.addEventListener('click', load);
load();
