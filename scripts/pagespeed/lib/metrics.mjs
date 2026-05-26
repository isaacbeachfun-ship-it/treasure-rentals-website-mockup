const CORE_THRESHOLDS = {
  lcp: { good: 2500, needsImprovement: 4000 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  inp: { good: 200, needsImprovement: 500 },
  fcp: { good: 1800, needsImprovement: 3000 },
  ttfb: { good: 800, needsImprovement: 1800 },
};

const SCORE_KEYS = {
  performance: 'performance',
  accessibility: 'accessibility',
  bestPractices: 'best-practices',
  seo: 'seo',
};

const LAB_AUDITS = {
  fcpMs: 'first-contentful-paint',
  lcpMs: 'largest-contentful-paint',
  cls: 'cumulative-layout-shift',
  tbtMs: 'total-blocking-time',
  speedIndexMs: 'speed-index',
};

const FIELD_METRICS = {
  lcpMs: 'largest_contentful_paint',
  cls: 'cumulative_layout_shift',
  inpMs: 'interaction_to_next_paint',
  fcpMs: 'first_contentful_paint',
  ttfbMs: 'experimental_time_to_first_byte',
};

export function normalizeWebsite(value) {
  const cleaned = String(value || '')
    .trim()
    .replace(/\s*\([^)]*\)\s*/g, '')
    .split(/\s+\/\s+/)[0]
    .trim();

  if (!cleaned || /^(unconfirmed|unknown|n\/a)/i.test(cleaned)) {
    return null;
  }

  try {
    const withProtocol = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
    const url = new URL(withProtocol);
    return {
      url: url.href,
      origin: url.origin,
      hostname: url.hostname,
    };
  } catch {
    return null;
  }
}

export function classifyCoreMetric(metric, value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'missing';
  }

  const threshold = CORE_THRESHOLDS[metric];
  if (!threshold) {
    return 'missing';
  }

  const numeric = Number(value);
  if (numeric <= threshold.good) return 'good';
  if (numeric <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

export function classifyScore(score) {
  if (score === null || score === undefined || Number.isNaN(Number(score))) {
    return 'missing';
  }

  const numeric = Number(score);
  if (numeric >= 90) return 'good';
  if (numeric >= 50) return 'needs-improvement';
  return 'poor';
}

export function extractPsiResult(payload) {
  const lighthouse = payload?.lighthouseResult || {};
  const categories = lighthouse.categories || {};
  const audits = lighthouse.audits || {};

  const scores = Object.fromEntries(
    Object.entries(SCORE_KEYS).map(([targetKey, sourceKey]) => [
      targetKey,
      scoreToInteger(categories[sourceKey]?.score),
    ]),
  );

  const lab = Object.fromEntries(
    Object.entries(LAB_AUDITS).map(([targetKey, auditKey]) => [
      targetKey,
      numberOrNull(audits[auditKey]?.numericValue),
    ]),
  );

  return {
    finalUrl: lighthouse.finalUrl || payload?.id || null,
    timestamp: payload?.analysisUTCTimestamp || null,
    scores,
    scoreStatus: Object.fromEntries(
      Object.entries(scores).map(([key, value]) => [key, classifyScore(value)]),
    ),
    lab,
    labDisplay: Object.fromEntries(
      Object.entries(LAB_AUDITS).map(([targetKey, auditKey]) => [
        targetKey,
        audits[auditKey]?.displayValue || null,
      ]),
    ),
  };
}

export function extractCruxResult(payload) {
  const record = payload?.record || {};
  const key = record.key || {};
  const metrics = record.metrics || {};
  const field = Object.fromEntries(
    Object.entries(FIELD_METRICS).map(([targetKey, sourceKey]) => [
      targetKey,
      numberOrNull(metrics[sourceKey]?.percentiles?.p75),
    ]),
  );

  const status = {
    lcp: classifyCoreMetric('lcp', field.lcpMs),
    cls: classifyCoreMetric('cls', field.cls),
    inp: classifyCoreMetric('inp', field.inpMs),
  };
  status.coreWebVitals = [status.lcp, status.cls, status.inp].every((value) => value === 'good')
    ? 'pass'
    : [status.lcp, status.cls, status.inp].some((value) => value === 'missing')
      ? 'missing'
      : 'fail';

  return {
    source: key.url ? 'page' : key.origin ? 'origin' : 'unknown',
    key,
    collectionPeriod: formatCollectionPeriod(record.collectionPeriod),
    field,
    status,
  };
}

export function makeErrorResult(error) {
  return {
    message: error?.message || String(error),
  };
}

function scoreToInteger(score) {
  if (score === null || score === undefined || Number.isNaN(Number(score))) {
    return null;
  }
  return Math.round(Number(score) * 100);
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
}

function formatCollectionPeriod(period) {
  if (!period?.firstDate || !period?.lastDate) {
    return null;
  }
  return `${formatDateObject(period.firstDate)} to ${formatDateObject(period.lastDate)}`;
}

function formatDateObject(value) {
  const month = String(value.month).padStart(2, '0');
  const day = String(value.day).padStart(2, '0');
  return `${value.year}-${month}-${day}`;
}
