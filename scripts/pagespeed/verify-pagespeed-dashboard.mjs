#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const REQUIRED_FILES = [
  'pagespeed-dashboard/index.html',
  'pagespeed-dashboard/styles.css',
  'pagespeed-dashboard/dashboard.js',
  'pagespeed-dashboard/dashboard-core.mjs',
  'pagespeed-dashboard/data/track-sites.json',
  'pagespeed-dashboard/data/pagespeed-results.json',
  'scripts/pagespeed/fetch-pagespeed-data.mjs',
  'scripts/pagespeed/lib/metrics.mjs',
];

async function main() {
  for (const file of REQUIRED_FILES) {
    await assertFile(file);
  }

  const source = await readJson('pagespeed-dashboard/data/track-sites.json');
  const results = await readJson('pagespeed-dashboard/data/pagespeed-results.json');

  assert(Array.isArray(source), 'track-sites.json must be an array');
  assert(source.length === 42, `expected 42 Track source rows, found ${source.length}`);
  assert(Array.isArray(results.sites), 'pagespeed-results.json must include a sites array');
  assert(results.sites.length === source.length, 'results site count must match source site count');
  assert(results.source?.spreadsheetUrl?.includes('1YrcuzgVAJvAzPzLxI7IDIlcXJoXt1qNx_9mI2jRpBM0'), 'source spreadsheet URL is missing');

  const first = results.sites[0];
  assert(first.company === 'Surf or Sound Realty', 'first source row should be Surf or Sound Realty');
  assert(first.results && first.results.mobile && first.results.desktop, 'each site must include mobile and desktop result slots');

  const confirmedUrls = results.sites.filter((site) => site.normalizedUrl).length;
  assert(confirmedUrls >= 38, `expected at least 38 confirmed URLs, found ${confirmedUrls}`);

  console.log('PageSpeed dashboard checks passed.');
}

async function assertFile(file) {
  const stats = await fs.stat(path.join(ROOT, file));
  assert(stats.isFile(), `${file} is not a file`);
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(path.join(ROOT, file), 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
