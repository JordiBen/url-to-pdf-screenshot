# URL & HTML to PDF and Screenshot (PNG/JPEG/WebP, full page)

[![Run on Apify](https://img.shields.io/badge/Run%20on-Apify-1f6feb?logo=apify)](https://apify.com/manageable_gully/url-to-pdf-screenshot) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Run it in the cloud with no setup:** [URL & HTML to PDF and Full-Page Screenshot on the Apify Store](https://apify.com/manageable_gully/url-to-pdf-screenshot).  
> Pay only per result, export to JSON/CSV/Excel, schedule runs and call it from the API.
<!-- Note: the Apify Store page goes live once the Actor is published. -->
<!-- AFFILIATE_LINK_PLACEHOLDER: replace the Apify links above with the affiliate link when available -->

Render **web pages or your own HTML** in real headless Chrome and get:
- **Screenshots:** full page or viewport, PNG, JPEG or WebP, on desktop, laptop, tablet or mobile (retina) viewports.
- **PDFs:** A4, Letter, Legal and more, with portrait or landscape, margins and backgrounds.

Each file is stored in the run's key-value store with a **shareable link** in the results table.

## Use cases
- **HTML to PDF for invoices, reports and certificates:** send your own HTML and get print-ready PDFs back through the API.
- **Visual monitoring and archiving:** capture competitor pages, landing pages or legal pages on a schedule.
- **Social and SEO previews:** mobile and desktop screenshots for audits and reports.
- **QA:** check how pages look on mobile vs. desktop after a deploy.

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

## Pricing
Pay per event: **$0.002 per screenshot** and **$0.003 per PDF**, plus $0.002 per run. For example, 1,000 full-page screenshots cost about $2. Failed pages are not charged. Set "max cost per run" to cap spend.

## Notes
- Pages behind logins and bot walls are not supported.
- Very long pages are captured in full. Expect large PNGs; use JPEG or WebP for smaller files.

*This Actor was built and is maintained with AI assistance. Report issues on the Issues tab; they are monitored daily.*

## Run from source
This repository is the full source of the [URL & HTML to PDF and Full-Page Screenshot](https://apify.com/manageable_gully/url-to-pdf-screenshot) Actor.

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
