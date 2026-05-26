#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  extractCruxResult,
  extractPsiResult,
  makeErrorResult,
  normalizeWebsite,
} from './lib/metrics.mjs';

const ROOT = process.cwd();
const SOURCE_FILE = path.join(ROOT, 'pagespeed-dashboard/data/track-sites.json');
const OUTPUT_FILE = path.join(ROOT, 'pagespeed-dashboard/data/pagespeed-results.json');
const API_KEY = process.env.PAGESPEED_API_KEY || process.env.CRUX_API_KEY || process.env.GOOGLE_API_KEY || '';
let requestTimeoutMs = 120000;

const DEVICES = {
  mobile: { psiStrategy: 'mobile', cruxFormFactor: 'PHONE' },
  desktop: { psiStrategy: 'desktop', cruxFormFactor: 'DESKTOP' },
};

const PSI_CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
const CRUX_METRICS = [
  'largest_contentful_paint',
  'cumulative_layout_shift',
  'interaction_to_next_paint',
  'first_contentful_paint',
  'experimental_time_to_first_byte',
];

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const skipApi = Boolean(args['skip-api']);
  const limit = args.limit ? Number(args.limit) : null;
  const delayMs = args['delay-ms'] ? Number(args['delay-ms']) : 250;
  const concurrency = args.concurrency ? Number(args.concurrency) : 3;
  requestTimeoutMs = args['request-timeout-ms'] ? Number(args['request-timeout-ms']) : requestTimeoutMs;

  if (!API_KEY && !skipApi) {
    throw new Error(
      'Missing API key. Set PAGESPEED_API_KEY, CRUX_API_KEY, or GOOGLE_API_KEY, or run with --skip-api to write a skeleton dashboard file.',
    );
  }

  const rawSites = JSON.parse(await fs.readFile(SOURCE_FILE, 'utf8'));
  const selectedSites = Number.isFinite(limit) ? rawSites.slice(0, limit) : rawSites;
  const sites = [];

  selectedSites.forEach((source, index) => sites.push(makeSiteRecord(source, index)));

  if (!skipApi) {
    const tasks = sites
      .filter((site) => !site.skippedReason)
      .flatMap((site) =>
        Object.entries(DEVICES).map(([device, config]) => async () => {
          console.log(`Fetching ${device}: ${site.company} (${site.normalizedUrl})`);
          site.results[device] = await fetchDeviceResult(site, config);
          await sleep(delayMs);
        }),
      );

    await runQueue(tasks, concurrency);
  }

  const output = {
    generatedAt: skipApi ? null : new Date().toISOString(),
    generatedMode: skipApi ? 'skeleton' : 'api',
    source: {
      title: 'Track PMS Vacation Rental Sites - 2026-05-23',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1YrcuzgVAJvAzPzLxI7IDIlcXJoXt1qNx_9mI2jRpBM0',
      rowCount: rawSites.length,
    },
    api: {
      pageSpeedInsights: 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed',
      chromeUxReport: 'https://chromeuxreport.googleapis.com/v1/records:queryRecord',
      fieldDataGranularity: 'origin',
    },
    sites,
  };

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Wrote ${OUTPUT_FILE}`);
}

function makeSiteRecord(source, index) {
  const normalized = normalizeWebsite(source.mainWebsite);
  return {
    id: slugify(`${index + 1}-${source.company}`),
    category: source.category,
    company: source.company,
    mainWebsite: source.mainWebsite,
    trackTenantSlug: source.trackTenantSlug,
    state: source.state,
    marketOrTown: source.marketOrTown,
    propertyCount: source.propertyCount,
    verificationNotes: source.verificationNotes,
    normalizedUrl: normalized?.url || null,
    origin: normalized?.origin || null,
    skippedReason: normalized ? null : 'No confirmed consumer website URL in source sheet',
    results: {
      mobile: {},
      desktop: {},
    },
  };
}

async function fetchDeviceResult(site, config) {
  const result = {};

  try {
    result.psi = extractPsiResult(await fetchPsi(site.normalizedUrl, config.psiStrategy));
  } catch (error) {
    result.psiError = makeErrorResult(error);
  }

  try {
    result.crux = extractCruxResult(await fetchCrux(site.origin, config.cruxFormFactor));
  } catch (error) {
    result.cruxError = makeErrorResult(error);
  }

  return result;
}

async function fetchPsi(url, strategy) {
  const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  endpoint.searchParams.set('url', url);
  endpoint.searchParams.set('strategy', strategy);
  endpoint.searchParams.set('key', API_KEY);
  for (const category of PSI_CATEGORIES) {
    endpoint.searchParams.append('category', category);
  }
  return requestJson(endpoint);
}

async function fetchCrux(origin, formFactor) {
  const endpoint = new URL('https://chromeuxreport.googleapis.com/v1/records:queryRecord');
  endpoint.searchParams.set('key', API_KEY);
  return requestJson(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin,
      formFactor,
      metrics: CRUX_METRICS,
    }),
  });
}

async function requestJson(url, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  const response = await fetch(url, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timeout);
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = json?.error?.message || response.statusText || 'Unknown API error';
    throw new Error(`${response.status}: ${message}`);
  }

  return json;
}

async function runQueue(tasks, concurrency) {
  const workerCount = Math.max(1, Math.min(concurrency, tasks.length || 1));
  let index = 0;

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (index < tasks.length) {
        const task = tasks[index];
        index += 1;
        await task();
      }
    }),
  );
}

function parseArgs(args) {
  return Object.fromEntries(
    args.map((arg) => {
      const trimmed = arg.replace(/^--/, '');
      const [key, ...rest] = trimmed.split('=');
      return [key, rest.length ? rest.join('=') : true];
    }),
  );
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
