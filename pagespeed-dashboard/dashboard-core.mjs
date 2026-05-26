export function buildRows(data, device) {
  return (data?.sites || []).map((site, index) => {
    const result = site.results?.[device] || {};
    const psi = result.psi || {};
    const crux = result.crux || {};

    return {
      index,
      company: site.company,
      category: site.category,
      market: site.marketOrTown,
      state: site.state,
      mainWebsite: site.mainWebsite,
      normalizedUrl: site.normalizedUrl,
      propertyCount: site.propertyCount,
      verificationNotes: site.verificationNotes,
      performance: valueOrNull(psi.scores?.performance),
      accessibility: valueOrNull(psi.scores?.accessibility),
      bestPractices: valueOrNull(psi.scores?.bestPractices),
      seo: valueOrNull(psi.scores?.seo),
      labLcpMs: valueOrNull(psi.lab?.lcpMs),
      labCls: valueOrNull(psi.lab?.cls),
      tbtMs: valueOrNull(psi.lab?.tbtMs),
      fcpMs: valueOrNull(psi.lab?.fcpMs),
      speedIndexMs: valueOrNull(psi.lab?.speedIndexMs),
      fieldLcpMs: valueOrNull(crux.field?.lcpMs),
      fieldCls: valueOrNull(crux.field?.cls),
      fieldInpMs: valueOrNull(crux.field?.inpMs),
      lcpStatus: crux.status?.lcp || 'missing',
      clsStatus: crux.status?.cls || 'missing',
      inpStatus: crux.status?.inp || 'missing',
      coreWebVitals: crux.status?.coreWebVitals || 'missing',
      fieldSource: crux.source || 'missing',
      collectionPeriod: crux.collectionPeriod || null,
      psiError: result.psiError?.message || null,
      cruxError: isExpectedCruxMiss(result.cruxError?.message) ? null : result.cruxError?.message || null,
      skippedReason: site.skippedReason || null,
    };
  });
}

export function computeSummary(data, device) {
  const rows = buildRows(data, device);
  const performanceScores = rows.map((row) => row.performance).filter(isNumber);
  const coreWebVitalsPasses = rows.filter((row) => row.coreWebVitals === 'pass').length;
  const withErrors = rows.filter((row) => row.psiError || row.cruxError || row.skippedReason).length;

  return {
    totalSites: rows.length,
    testedSites: rows.filter((row) => row.normalizedUrl && !row.skippedReason).length,
    averagePerformance: averageRounded(performanceScores),
    coreWebVitalsPasses,
    coreWebVitalsFailures: rows.filter((row) => row.coreWebVitals === 'fail').length,
    missingCoreWebVitals: rows.filter((row) => row.coreWebVitals === 'missing').length,
    withErrors,
    generatedAt: data?.generatedAt || null,
  };
}

export function filterRows(rows, query) {
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) => {
    return [
      row.company,
      row.category,
      row.market,
      row.state,
      row.mainWebsite,
      row.normalizedUrl,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle));
  });
}

export function sortRows(rows, key, direction = 'asc') {
  const multiplier = direction === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => compareValues(a[key], b[key]) * multiplier);
}

export function formatScore(value) {
  return isNumber(value) ? String(value) : 'n/a';
}

export function formatMs(value) {
  if (!isNumber(value)) return 'n/a';
  if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
  return `${Math.round(value)}ms`;
}

export function formatCls(value) {
  return isNumber(value) ? value.toFixed(2) : 'n/a';
}

export function formatPercent(value) {
  return isNumber(value) ? `${Math.round(value)}%` : 'n/a';
}

function valueOrNull(value) {
  return isNumber(value) ? Number(value) : null;
}

function isExpectedCruxMiss(message) {
  return /404: chrome ux report data not found/i.test(String(message || ''));
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function averageRounded(values) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function compareValues(a, b) {
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}
