const credits = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1 });

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value ?? '—';
}

function formatCredits(value) {
  return Number.isFinite(Number(value)) ? `${credits.format(Number(value))} cr` : '—';
}

function cell(row, value, className = '') {
  const node = document.createElement('td');
  node.textContent = value ?? '—';
  if (className) node.className = className;
  row.append(node);
}

function renderComponents(rows = []) {
  const body = document.getElementById('components-body');
  body.replaceChildren();
  const sorted = [...rows].sort((left, right) => Number(right.creditsDelta ?? 0) - Number(left.creditsDelta ?? 0));
  for (const component of sorted) {
    const row = document.createElement('tr');
    cell(row, component.name ?? component.componentKey, 'component-name');
    cell(row, component.kind === 'MAKE_SCENARIO' ? 'Make' : 'Agent');
    cell(row, component.costClass ?? 'Niet ingedeeld');
    cell(row, formatCredits(component.creditsDelta), 'numeric');
    cell(row, formatCredits(component.creditsPerVerifiedOutcome), 'numeric');
    cell(row, component.runDecision ?? '—', `decision decision-${String(component.runDecision ?? '').toLowerCase()}`);
    body.append(row);
  }
  setText('component-count', String(sorted.length));
  document.getElementById('components-empty').hidden = sorted.length > 0;
}

function renderConsumers(rows = []) {
  const list = document.getElementById('consumers-list');
  list.replaceChildren();
  for (const item of rows.slice(0, 10)) {
    const entry = document.createElement('li');
    const name = document.createElement('span');
    const value = document.createElement('strong');
    name.textContent = item.name ?? item.componentKey ?? 'Onbekend';
    value.textContent = formatCredits(item.creditsDelta);
    entry.append(name, value);
    list.append(entry);
  }
  document.getElementById('consumers-empty').hidden = rows.length > 0;
}

function renderList(listId, emptyId, rows, describe) {
  const list = document.getElementById(listId);
  list.replaceChildren();
  for (const row of rows ?? []) {
    const entry = document.createElement('li');
    const title = document.createElement('strong');
    const detail = document.createElement('span');
    title.textContent = row.name ?? row.componentKey ?? row.type ?? 'Onderdeel';
    detail.textContent = describe(row);
    entry.append(title, detail);
    list.append(entry);
  }
  document.getElementById(emptyId).hidden = (rows ?? []).length > 0;
}

function render(data) {
  setText('monthly-limit', formatCredits(data.budget?.monthlyLimit));
  setText('used-credits', formatCredits(data.budget?.usedCredits));
  setText('remaining-credits', formatCredits(data.budget?.remainingCredits));
  setText('daily-allowance', formatCredits(data.budget?.dailyAllowance));
  setText('budget-state', data.budget?.state);
  setText('freshness', `${data.freshness ?? 'ONBEKEND'} · ${data.sourceUpdatedAt ? new Date(data.sourceUpdatedAt).toLocaleString('nl-NL') : 'geen meting'}`);
  document.getElementById('status-dot').dataset.state = String(data.freshness ?? '').toLowerCase();
  setText('team-contract', data.contract?.teamContract);
  setText('watermark', data.contract?.bg167Watermark);
  setText('snapshot', data.contract?.snapshotFingerprint);
  renderComponents(data.components);
  renderConsumers(data.topConsumers?.length ? data.topConsumers : data.components);
  renderList('waste-list', 'waste-empty', data.wasteSignals, row => `${row.type ?? 'signaal'} · mogelijke besparing ${formatCredits(row.expectedSavings)}`);
  renderList('savings-list', 'savings-empty', data.savings, row => `${formatCredits(row.creditsSaved)} aantoonbaar bespaard`);
  renderList('deferred-list', 'deferred-empty', data.deferredWork, row => row.reason ?? row.runDecision ?? 'Budgetlimiet');
}

async function load() {
  try {
    const response = await fetch('/api/powerhouse-costs', { credentials: 'same-origin', headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'Geen toegang tot de kostenprojectie.' : 'De kostenprojectie is niet beschikbaar.');
    render(await response.json());
  } catch (error) {
    const target = document.getElementById('error');
    target.textContent = error.message;
    target.hidden = false;
    setText('freshness', 'Niet beschikbaar');
    document.getElementById('status-dot').dataset.state = 'error';
  }
}

load();
