import test from 'node:test';
import assert from 'node:assert/strict';

import { buildRows, computeSummary, filterRows, sortRows } from '../../../pagespeed-dashboard/dashboard-core.mjs';

const fixture = {
  generatedAt: '2026-05-26T14:30:00Z',
  sites: [
    {
      company: 'Fast Homes',
      category: 'External Verified',
      mainWebsite: 'fast.example',
      normalizedUrl: 'https://fast.example/',
      propertyCount: '100',
      results: {
        mobile: {
          psi: { scores: { performance: 82, accessibility: 91, bestPractices: 87, seo: 95 }, lab: { lcpMs: 3100, cls: 0.04, tbtMs: 120, fcpMs: 1400, speedIndexMs: 2800 } },
          crux: { field: { lcpMs: 2400, cls: 0.08, inpMs: 160 }, status: { lcp: 'good', cls: 'good', inp: 'good', coreWebVitals: 'pass' } },
        },
        desktop: {
          psi: { scores: { performance: 96, accessibility: 97, bestPractices: 92, seo: 100 }, lab: { lcpMs: 1100, cls: 0.01, tbtMs: 20, fcpMs: 700, speedIndexMs: 1200 } },
          crux: { field: { lcpMs: 900, cls: 0.01, inpMs: 90 }, status: { lcp: 'good', cls: 'good', inp: 'good', coreWebVitals: 'pass' } },
        },
      },
    },
    {
      company: 'Slow Villas',
      category: 'Lead',
      mainWebsite: 'slow.example',
      normalizedUrl: 'https://slow.example/',
      propertyCount: 'unknown',
      results: {
        mobile: {
          psi: { scores: { performance: 41, accessibility: 80, bestPractices: 72, seo: 88 }, lab: { lcpMs: 6200, cls: 0.28, tbtMs: 850, fcpMs: 3300, speedIndexMs: 7100 } },
          crux: { field: { lcpMs: 4300, cls: 0.29, inpMs: 540 }, status: { lcp: 'poor', cls: 'poor', inp: 'poor', coreWebVitals: 'fail' } },
        },
        desktop: {
          psi: { scores: { performance: 70, accessibility: 80, bestPractices: 72, seo: 88 }, lab: { lcpMs: 2600, cls: 0.12, tbtMs: 250, fcpMs: 1500, speedIndexMs: 3200 } },
          crux: { field: { lcpMs: 2600, cls: 0.12, inpMs: 220 }, status: { lcp: 'needs-improvement', cls: 'needs-improvement', inp: 'needs-improvement', coreWebVitals: 'fail' } },
        },
      },
    },
  ],
};

test('buildRows selects mobile or desktop values from the same site records', () => {
  const mobileRows = buildRows(fixture, 'mobile');
  const desktopRows = buildRows(fixture, 'desktop');

  assert.equal(mobileRows[0].performance, 82);
  assert.equal(desktopRows[0].performance, 96);
  assert.equal(mobileRows[1].fieldLcpMs, 4300);
  assert.equal(desktopRows[1].fieldLcpMs, 2600);
});

test('computeSummary reflects the selected device', () => {
  const mobile = computeSummary(fixture, 'mobile');
  const desktop = computeSummary(fixture, 'desktop');

  assert.equal(mobile.averagePerformance, 62);
  assert.equal(desktop.averagePerformance, 83);
  assert.equal(mobile.coreWebVitalsPasses, 1);
  assert.equal(desktop.coreWebVitalsPasses, 1);
});

test('filters and sorts rows without mutating the source array', () => {
  const rows = buildRows(fixture, 'mobile');
  assert.deepEqual(filterRows(rows, 'slow').map((row) => row.company), ['Slow Villas']);

  const sorted = sortRows(rows, 'performance', 'asc');
  assert.deepEqual(sorted.map((row) => row.company), ['Slow Villas', 'Fast Homes']);
  assert.deepEqual(rows.map((row) => row.company), ['Fast Homes', 'Slow Villas']);
});
