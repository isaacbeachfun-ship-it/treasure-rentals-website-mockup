import {
  buildRows,
  computeSummary,
  filterRows,
  formatCls,
  formatMs,
  formatPercent,
  formatScore,
  sortRows,
} from './dashboard-core.mjs';

const state = {
  data: null,
  device: 'mobile',
  query: '',
  sortKey: 'performance',
  sortDirection: 'asc',
};

const elements = {
  meta: document.querySelector('#data-meta'),
  statusBanner: document.querySelector('#status-banner'),
  summaryGrid: document.querySelector('#summary-grid'),
  rowCount: document.querySelector('#row-count'),
  search: document.querySelector('#site-search'),
  tableBody: document.querySelector('#site-table-body'),
  deviceButtons: [...document.querySelectorAll('.device-button')],
  sortButtons: [...document.querySelectorAll('[data-sort]')],
};

init();

async function init() {
  bindEvents();
  try {
    const response = await fetch('./data/pagespeed-results.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Unable to load dashboard data (${response.status})`);
    state.data = await response.json();
    render();
  } catch (error) {
    elements.meta.textContent = 'Data failed to load';
    elements.statusBanner.textContent = error.message;
    elements.statusBanner.classList.remove('is-hidden');
  }
}

function bindEvents() {
  for (const button of elements.deviceButtons) {
    button.addEventListener('click', () => {
      state.device = button.dataset.device;
      render();
    });
  }

  elements.search.addEventListener('input', (event) => {
    state.query = event.target.value;
    renderTable();
  });

  for (const button of elements.sortButtons) {
    button.addEventListener('click', () => {
      const nextKey = button.dataset.sort;
      if (state.sortKey === nextKey) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortKey = nextKey;
        state.sortDirection = nextKey === 'company' ? 'asc' : 'asc';
      }
      renderTable();
    });
  }
}

function render() {
  renderHeader();
  renderSummary();
  renderTable();
  renderToggle();
}

function renderHeader() {
  const source = state.data.source || {};
  const generated = state.data.generatedAt
    ? `Generated ${new Date(state.data.generatedAt).toLocaleString()}`
    : 'No API readings generated yet';
  elements.meta.textContent = `${generated} | ${source.rowCount || state.data.sites.length} source sites | ${state.device}`;

  const skeleton = state.data.generatedMode === 'skeleton';
  elements.statusBanner.classList.toggle('is-hidden', !skeleton);
  if (skeleton) {
    elements.statusBanner.textContent =
      'API key still needed: this dashboard is wired up, but the PageSpeed and CrUX readings have not been pulled yet.';
  }
}

function renderSummary() {
  const summary = computeSummary(state.data, state.device);
  const cards = [
    ['Sites', summary.totalSites, `${summary.testedSites} with confirmed URLs`],
    ['Avg Perf', formatScore(summary.averagePerformance), 'Lighthouse score'],
    ['CWV Pass', summary.coreWebVitalsPasses, 'Field LCP + CLS + INP'],
    ['CWV Fail', summary.coreWebVitalsFailures, 'Needs attention'],
    ['Missing CWV', summary.missingCoreWebVitals, 'No field data or not fetched'],
    ['Errors', summary.withErrors, 'Skipped or API errors'],
  ];

  elements.summaryGrid.innerHTML = cards
    .map(
      ([label, value, note]) => `
        <article class="summary-card">
          <p class="summary-label">${escapeHtml(label)}</p>
          <p class="summary-value">${escapeHtml(value)}</p>
          <p class="summary-note">${escapeHtml(note)}</p>
        </article>
      `,
    )
    .join('');
}

function renderTable() {
  let rows = buildRows(state.data, state.device);
  rows = filterRows(rows, state.query);
  rows = sortRows(rows, state.sortKey, state.sortDirection);

  elements.rowCount.textContent = `${rows.length} rows`;
  elements.tableBody.innerHTML = rows.map(renderRow).join('');
}

function renderToggle() {
  for (const button of elements.deviceButtons) {
    button.classList.toggle('is-active', button.dataset.device === state.device);
  }
}

function renderRow(row) {
  const notes = [row.verificationNotes, row.skippedReason]
    .filter(Boolean)
    .map(escapeHtml)
    .join('<br>');
  const errors = [row.psiError ? `PSI: ${row.psiError}` : '', row.cruxError ? `CrUX: ${row.cruxError}` : '']
    .filter(Boolean)
    .map((value) => `<span class="error-note">${escapeHtml(value)}</span>`)
    .join('');

  return `
    <tr>
      <td class="company-cell">
        <div class="company-name">${escapeHtml(row.company)}</div>
        ${row.normalizedUrl ? `<a class="company-url" href="${escapeAttribute(row.normalizedUrl)}" target="_blank" rel="noreferrer">${escapeHtml(row.mainWebsite)}</a>` : `<span class="muted">${escapeHtml(row.mainWebsite)}</span>`}
      </td>
      <td>${escapeHtml(row.market || 'n/a')}<br><span class="muted">${escapeHtml(row.state || '')}</span></td>
      <td class="number">${escapeHtml(row.propertyCount || 'n/a')}</td>
      ${scoreCell(row.performance)}
      ${scoreCell(row.accessibility)}
      ${scoreCell(row.bestPractices)}
      ${scoreCell(row.seo)}
      <td class="number ${metricClass(row.lcpStatus)}">${formatMs(row.fieldLcpMs)}</td>
      <td class="number ${metricClass(row.inpStatus)}">${formatMs(row.fieldInpMs)}</td>
      <td class="number ${metricClass(row.clsStatus)}">${formatCls(row.fieldCls)}</td>
      <td>${statusBadge(row.coreWebVitals)}</td>
      <td class="number">${formatMs(row.labLcpMs)}</td>
      <td class="number">${formatMs(row.tbtMs)}</td>
      <td class="notes-cell">${notes}${errors}</td>
    </tr>
  `;
}

function scoreCell(score) {
  return `<td class="number ${scoreClass(score)}">${formatPercent(score)}</td>`;
}

function scoreClass(score) {
  if (score === null || score === undefined) return 'score-missing';
  if (score >= 90) return 'score-good';
  if (score >= 50) return 'score-needs-improvement';
  return 'score-poor';
}

function metricClass(status) {
  return `score-${status || 'missing'}`;
}

function statusBadge(status) {
  const value = status || 'missing';
  const label = value === 'pass' ? 'Pass' : value === 'fail' ? 'Fail' : 'Missing';
  return `<span class="badge badge-${escapeAttribute(value)}">${escapeHtml(label)}</span>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#096;');
}
