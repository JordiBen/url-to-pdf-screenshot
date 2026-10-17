import assert from 'node:assert/strict';
import http from 'node:http';
import { after, before, describe, it } from 'node:test';
import { launchBrowser, parseInput, renderJob } from '../src/render.js';

const PAGE = `<!doctype html><html><head><title>Render test</title></head><body style="margin:0">
<div style="height:3000px;background:linear-gradient(#f00,#00f)"><h1>Hello PDF</h1><p>שלום עולם</p></div>
<div class="cookie-banner" style="position:fixed;bottom:0">We use cookies</div></body></html>`;

describe('parseInput', () => {
    it('validates and normalizes', () => {
        const c = parseInput({ urls: ['example.com', 'https://example.com/', 'bad host!'], htmlDocuments: [{ name: 'my doc', html: '<p>x</p>' }], outputs: ['pdf', 'screenshot'], maxConcurrency: 99 });
        assert.equal(c.jobs.length, 2);
        assert.equal(c.jobs[0].url, 'https://example.com/');
        assert.equal(c.jobs[1].name, 'my-doc');
        assert.equal(c.invalid.length, 1);
        assert.equal(c.maxConcurrency, 10);
        assert.throws(() => parseInput({}));
        assert.throws(() => parseInput({ urls: ['a.com'], device: 'watch' }));
        assert.throws(() => parseInput({ urls: ['a.com'], outputs: ['gif'] }));
    });
});

describe('rendering with real Chrome', { timeout: 120000 }, () => {
    let server; let base; let browser;
    before(async () => {
        server = http.createServer((req, res) => {
            if (req.url === '/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(PAGE); return; }
            if (req.url === '/gone') { res.writeHead(404, { 'content-type': 'text/html' }); res.end('<h1>404</h1>'); return; }
            res.writeHead(404); res.end();
        });
        await new Promise((r) => server.listen(0, '127.0.0.1', r));
        base = `http://127.0.0.1:${server.address().port}`;
        browser = await launchBrowser();
    });
    after(async () => { await browser?.close(); server?.close(); });

    it('renders a full-page PNG and an A4 PDF from a URL', async () => {
        const cfg = parseInput({ urls: [base + '/'], outputs: ['screenshot', 'pdf'] });
        const r = await renderJob(browser, cfg.jobs[0], cfg, { allowPrivate: true });
        assert.equal(r.status, 200);
        assert.equal(r.title, 'Render test');
        assert.deepEqual([...r.screenshot.subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47]);
        const h = r.screenshot.readUInt32BE(20); // PNG IHDR height
        assert.ok(h >= 3000, `full page height ${h}`);
        assert.equal(r.pdf.subarray(0, 5).toString(), '%PDF-');
        const pages = (r.pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
        assert.ok(pages >= 2, `pdf pages ${pages}`);
    });

    it('renders raw HTML to JPEG on a mobile viewport (viewport-only)', async () => {
        const cfg = parseInput({ htmlDocuments: ['<html><body><h1>Inline</h1></body></html>'], device: 'mobile', fullPage: false, screenshotFormat: 'jpeg' });
        const r = await renderJob(browser, cfg.jobs[0], cfg);
        assert.deepEqual([...r.screenshot.subarray(0, 3)], [0xff, 0xd8, 0xff]);
    });

    it('blocks navigation to private addresses by default', async () => {
        const cfg = parseInput({ urls: [base + '/'] });
        await assert.rejects(renderJob(browser, cfg.jobs[0], cfg), /blocked|ERR_ACCESS_DENIED|net::/i);
    });

    it('blocks private sub-resources inside user HTML', async () => {
        const cfg = parseInput({ htmlDocuments: [`<img src="${base}/secret.png"><iframe src="http://169.254.169.254/latest/meta-data/"></iframe>`] });
        const r = await renderJob(browser, cfg.jobs[0], cfg);
        assert.ok(r.blockedRequests >= 2, `blocked ${r.blockedRequests}`);
    });

    it('reports HTTP status for error pages', async () => {
        const cfg = parseInput({ urls: [base + '/gone'] });
        const r = await renderJob(browser, cfg.jobs[0], cfg, { allowPrivate: true });
        assert.equal(r.status, 404);
    });
});
