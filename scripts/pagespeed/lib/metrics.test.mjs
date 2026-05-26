import test from 'node:test';
import assert from 'node:assert/strict';

import {
  classifyCoreMetric,
  extractCruxResult,
  extractPsiResult,
  normalizeWebsite,
} from './metrics.mjs';

test('normalizes plain domains and strips notes or alternate domains', () => {
  assert.equal(normalizeWebsite('brett-robinson.com').url, 'https://brett-robinson.com/');
  assert.equal(normalizeWebsite('beachfrontonly.com (verify)').url, 'https://beachfrontonly.com/');
  assert.equal(
    normalizeWebsite('charlestoncoastvacations.com / dunesproperties.com').url,
    'https://charlestoncoastvacations.com/',
  );
});

test('returns null for unresolved website placeholders', () => {
  assert.equal(normalizeWebsite('unconfirmed'), null);
  assert.equal(normalizeWebsite('n/a single resort'), null);
  assert.equal(normalizeWebsite(''), null);
});

test('classifies Core Web Vitals using Google thresholds', () => {
  assert.equal(classifyCoreMetric('lcp', 2500), 'good');
  assert.equal(classifyCoreMetric('lcp', 3000), 'needs-improvement');
  assert.equal(classifyCoreMetric('lcp', 4500), 'poor');
  assert.equal(classifyCoreMetric('cls', 0.1), 'good');
  assert.equal(classifyCoreMetric('cls', 0.18), 'needs-improvement');
  assert.equal(classifyCoreMetric('cls', 0.3), 'poor');
  assert.equal(classifyCoreMetric('inp', 200), 'good');
  assert.equal(classifyCoreMetric('inp', 320), 'needs-improvement');
  assert.equal(classifyCoreMetric('inp', 650), 'poor');
});

test('extracts Lighthouse category scores and lab metrics from PSI payload', () => {
  const result = extractPsiResult({
    id: 'https://example.com/',
    analysisUTCTimestamp: '2026-05-26T14:00:00Z',
    lighthouseResult: {
      finalUrl: 'https://example.com/',
      categories: {
        performance: { score: 0.73 },
        accessibility: { score: 0.91 },
        'best-practices': { score: 0.86 },
        seo: { score: 1 },
      },
      audits: {
        'first-contentful-paint': { numericValue: 1300, displayValue: '1.3 s' },
        'largest-contentful-paint': { numericValue: 2800, displayValue: '2.8 s' },
        'cumulative-layout-shift': { numericValue: 0.04, displayValue: '0.04' },
        'total-blocking-time': { numericValue: 220, displayValue: '220 ms' },
        'speed-index': { numericValue: 3400, displayValue: '3.4 s' },
      },
    },
  });

  assert.equal(result.finalUrl, 'https://example.com/');
  assert.equal(result.scores.performance, 73);
  assert.equal(result.scores.accessibility, 91);
  assert.equal(result.scores.bestPractices, 86);
  assert.equal(result.scores.seo, 100);
  assert.equal(result.lab.lcpMs, 2800);
  assert.equal(result.lab.cls, 0.04);
  assert.equal(result.lab.tbtMs, 220);
});

test('extracts p75 field Core Web Vitals from CrUX payload', () => {
  const result = extractCruxResult({
    record: {
      key: { origin: 'https://example.com', formFactor: 'PHONE' },
      metrics: {
        largest_contentful_paint: { percentiles: { p75: 2300 } },
        cumulative_layout_shift: { percentiles: { p75: '0.08' } },
        interaction_to_next_paint: { percentiles: { p75: 180 } },
      },
      collectionPeriod: {
        firstDate: { year: 2026, month: 4, day: 28 },
        lastDate: { year: 2026, month: 5, day: 25 },
      },
    },
  });

  assert.equal(result.source, 'origin');
  assert.equal(result.field.lcpMs, 2300);
  assert.equal(result.field.cls, 0.08);
  assert.equal(result.field.inpMs, 180);
  assert.equal(result.status.lcp, 'good');
  assert.equal(result.status.cls, 'good');
  assert.equal(result.status.inp, 'good');
  assert.equal(result.status.coreWebVitals, 'pass');
  assert.equal(result.collectionPeriod, '2026-04-28 to 2026-05-25');
});
