# Website Screenshot & URL to PDF: Full-Page Screenshots and HTML to PDF in Headless Chrome

[![Run on Apify](https://img.shields.io/badge/Run%20on-Apify-1f6feb?logo=apify)](https://apify.com/manageable_gully/url-to-pdf-screenshot) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Run it in the cloud with no setup:** [Website Screenshot & URL to PDF: Full Page, HTML to PDF on the Apify Store](https://apify.com/manageable_gully/url-to-pdf-screenshot).  
> Pay only per result, export to JSON/CSV/Excel, schedule runs and call it from the API.
<!-- AFFILIATE_LINK_PLACEHOLDER: replace the Apify links above with the affiliate link when available -->

Render **web pages or your own HTML** in real headless Chrome and get:
- **Screenshots:** full page or viewport, PNG, JPEG or WebP, on desktop, laptop, tablet or mobile (retina) viewports.
- **PDFs:** A4, Letter, Legal and more, with portrait or landscape, margins and backgrounds.

Each file is stored in the run's key-value store with a **shareable link** in the results table.

## What you can use it for
- **HTML to PDF for invoices, reports and certificates:** send your own HTML and get print-ready PDFs back through the API.
- **Visual monitoring and archiving:** capture competitor pages, landing pages or legal pages on a schedule.
- **Social and SEO previews:** mobile and desktop screenshots for audits and reports.
- **QA:** check how pages look on mobile vs. desktop after a deploy.

## How to use it
1. Add page URLs under **URLs**, or paste your own HTML under **HTML documents**.
2. Choose **screenshot**, **PDF** or both, plus device and format.
3. Click **Start**.
4. Every result row has a shareable `screenshotUrl` / `pdfUrl`.

## Features
- Chrome with system fonts for **Hebrew, Arabic, CJK and emoji**, so right-to-left and non-Latin pages render correctly.
- **Hides common cookie banners** (OneTrust, Cookiebot, Usercentrics and others) before capturing.
- Wait strategies (network idle or load) plus an optional extra delay for animations and lazy-loaded content.
- Safe by default: every request the page makes is checked, and private or internal addresses are blocked, even from inside your own HTML.

## Input
```json
{
  "urls": ["https://example.com"],
  "htmlDocuments": [{"name": "invoice-42", "html": "<h1>Invoice 42</h1><p>Total: $10</p>"}],
  "outputs": ["screenshot", "pdf"], "device": "mobile", "fullPage": true, "pdfFormat": "A4"
}
```

## Output (one item per URL or HTML document)
```json
{
  "url": "https://example.com/", "status": 200, "title": "Example Domain",
  "screenshotUrl": "https://api.apify.com/v2/key-value-stores/<id>/records/example.com-b559c7edd3fb-mobile.png", "screenshotBytes": 257820,
  "pdfUrl": "https://api.apify.com/v2/key-value-stores/<id>/records/example.com-b559c7edd3fb.pdf", "pdfBytes": 115518
}
```

## Notes
- Pages behind logins and bot walls are not supported.
- Very long pages are captured in full. Expect large PNGs; use JPEG or WebP for smaller files.

## Pricing
Pay per event, no monthly rent:
- **$0.002 per screenshot**
- **$0.003 per PDF**
- $0.002 per run start

| Example | Cost |
|---|---|
| 100 full-page screenshots | $0.202 |
| 1,000 screenshots | $2.00 |
| 1,000 PDFs (e.g. invoices from HTML) | $3.00 |
| 500 URLs as screenshot + PDF | $2.50 |

Failed pages are not charged.

You can set a **maximum cost per run** in the run options; the Actor stops cleanly when it is reached. New to Apify? The free plan includes $5 of platform credit every month, so you can try this Actor at no cost.

## API, integrations and AI agents (MCP)
Run it from your own code with the [Apify API](https://docs.apify.com/api/v2) and get the results in one call:
```bash
curl -X POST "https://api.apify.com/v2/acts/manageable_gully~url-to-pdf-screenshot/run-sync-get-dataset-items?token=<YOUR_APIFY_TOKEN>" \
  -H "Content-Type: application/json" -d @input.json
```
```python
from apify_client import ApifyClient
run = ApifyClient("<YOUR_APIFY_TOKEN>").actor("manageable_gully/url-to-pdf-screenshot").call(run_input={...})
```
- **No-code:** use the Apify app in **n8n, Make or Zapier** ("Run Actor", then "Get dataset items"), or send results to Google Sheets, Slack or a webhook.
- **AI agents (MCP):** add `https://mcp.apify.com?tools=manageable_gully/url-to-pdf-screenshot` to Claude, Cursor, VS Code or any MCP client and the agent can call this Actor as a tool.
- **Schedules:** run it hourly, daily or weekly from Apify Console.

## FAQ
**Can I convert my own HTML to PDF?** Yes. Send HTML in `htmlDocuments` (e.g. an invoice template you rendered) and get a print-ready PDF back through the API.

**Can it take mobile screenshots?** Yes. Pick a mobile or tablet device; screenshots use a retina viewport.

**Can AI agents use it?** Yes. It is available as a tool through the Apify MCP server (`https://mcp.apify.com?tools=manageable_gully/url-to-pdf-screenshot`) and the Apify API, and it returns structured JSON that agents can read directly.

## More tools from WebIntel Tools
- [Web Page to Markdown](https://apify.com/manageable_gully/page-to-markdown): clean Markdown and RAG chunks from any URL, for LLMs
- [Lighthouse & PageSpeed Bulk Audit](https://apify.com/manageable_gully/lighthouse-bulk-audit): Lighthouse scores and Core Web Vitals for hundreds of URLs
- [PDF & Image OCR Extractor](https://apify.com/manageable_gully/pdf-ocr-extractor): PDFs and images to text, Markdown and tables (incl. Hebrew/Arabic)
- [SEO Audit & Domain Checker](https://apify.com/manageable_gully/website-health-audit): SEO, DNS, SSL and security-header audit for lists of domains

See [all WebIntel Tools Actors](https://apify.com/manageable_gully).

*Made by WebIntel Tools. This Actor was built and is maintained with AI assistance. Report issues on the Issues tab; they are monitored daily.*

## Run from source
This repository is the full source of the [Website Screenshot & URL to PDF: Full Page, HTML to PDF](https://apify.com/manageable_gully/url-to-pdf-screenshot) Actor.

```bash
npm install
npm test
# run locally with the Apify CLI (https://docs.apify.com/cli):
apify run --input '{...}'
```

Deploy your own copy with `apify push`. The easiest way to use it is the hosted version on the [Apify Store](https://apify.com/manageable_gully/url-to-pdf-screenshot).

<!-- AFFILIATE_LINK_PLACEHOLDER: "New to Apify? Sign up here" link goes here -->

## License
MIT, see [LICENSE](LICENSE).
