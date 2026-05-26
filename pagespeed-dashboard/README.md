# Track PMS PageSpeed Dashboard

Static dashboard for the Track PMS vacation-rental site list.

## Data Pull

The dashboard reads:

```text
pagespeed-dashboard/data/pagespeed-results.json
```

Generate a skeleton file without API calls:

```bash
node scripts/pagespeed/fetch-pagespeed-data.mjs --skip-api
```

Generate real PageSpeed Insights and CrUX readings:

```bash
export GOOGLE_API_KEY="your-google-api-key"
node scripts/pagespeed/fetch-pagespeed-data.mjs --limit=1
node scripts/pagespeed/fetch-pagespeed-data.mjs
```

The key must have these APIs enabled in Google Cloud:

- PageSpeed Insights API
- Chrome UX Report API

## Local Preview

```bash
python3 -m http.server 8766
```

Open:

```text
http://127.0.0.1:8766/pagespeed-dashboard/
```

## Verification

```bash
node --test scripts/pagespeed/lib/*.test.mjs
node scripts/pagespeed/verify-pagespeed-dashboard.mjs
```
