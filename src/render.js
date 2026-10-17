// Core rendering logic (no Apify dependency): URL or HTML -> PDF / screenshot buffers.
import { existsSync } from 'node:fs';
import { lookup } from 'node:dns/promises';
import net from 'node:net';
import puppeteer from 'puppeteer-core';
import { isPublicIp } from './netguard.js';

export const DEVICES = {
    desktop: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    laptop: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    tablet: { width: 820, height: 1180, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    mobile: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
};
const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const COOKIE_HIDE_CSS = `#onetrust-banner-sdk,#onetrust-consent-sdk,.cc-window,.cookie-banner,#cookie-banner,.cookie-consent,#CybotCookiebotDialog,
.qc-cmp2-container,[id*="cookie-notice"],[class*="cookie-notice"],[aria-label*="cookie" i][role="dialog"],#usercentrics-root,.osano-cm-window{display:none!important}`;

export function chromePath() {
    const c = [process.env.CHROME_PATH, process.env.APIFY_CHROME_EXECUTABLE_PATH, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
    const p = c.find((x) => x && existsSync(x));
    if (!p) throw new Error('Chrome executable not found (set CHROME_PATH)');
    return p;
}

export async function launchBrowser() {
    return puppeteer.launch({
        executablePath: chromePath(),
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'],
    });
}

export function parseInput(input = {}) {
    const jobs = [];
    const invalid = [];
    for (const s of input.urls ?? []) {
        const raw = String((typeof s === 'string' ? s : s?.url) ?? '').trim();
        if (!raw) continue;
        try {
            const u = new URL(/^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`);
            if (!['http:', 'https:'].includes(u.protocol) || !/^[a-z0-9.-]+$/i.test(u.hostname)) throw new Error('invalid URL');
            u.hash = '';
            if (!jobs.some((j) => j.url === u.toString())) jobs.push({ url: u.toString() });
        } catch {
            invalid.push({ input: raw, error: 'Invalid URL' });
        }
    }
    (input.htmlDocuments ?? []).forEach((h, i) => {
        const html = typeof h === 'string' ? h : h?.html;
        const name = (typeof h === 'object' && h?.name) || `html-${i + 1}`;
        if (html && html.trim()) jobs.push({ html, name: String(name).replace(/[^a-z0-9_-]/gi, '-').slice(0, 60) });
    });
    if (!jobs.length && !invalid.length) throw new Error('Provide "urls" and/or "htmlDocuments".');
    if (jobs.length > 2000) throw new Error('At most 2000 documents per run.');
    const outputs = input.outputs?.length ? input.outputs : ['screenshot'];
    if (!outputs.every((o) => ['pdf', 'screenshot'].includes(o))) throw new Error('outputs must be pdf and/or screenshot');
    const device = input.device ?? 'desktop';
    if (!DEVICES[device]) throw new Error(`device must be one of ${Object.keys(DEVICES).join(', ')}`);
    const fmt = input.screenshotFormat ?? 'png';
    if (!['png', 'jpeg', 'webp'].includes(fmt)) throw new Error('screenshotFormat must be png, jpeg or webp');
    const paper = input.pdfFormat ?? 'A4';
    if (!['A4', 'A3', 'A5', 'Letter', 'Legal', 'Tabloid'].includes(paper)) throw new Error('invalid pdfFormat');
    return {
        jobs, invalid, outputs, device,
        fullPage: input.fullPage ?? true,
        screenshotFormat: fmt,
        quality: Math.min(Math.max(Number(input.quality ?? 85), 10), 100),
        pdfFormat: paper,
        landscape: Boolean(input.landscape ?? false),
        printBackground: input.printBackground ?? true,
        margin: String(input.pdfMargin ?? '10mm'),
        waitUntil: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'].includes(input.waitUntil) ? input.waitUntil : 'networkidle2',
        delayMs: Math.min(Math.max(Number(input.delayMs ?? 0), 0), 30000),
        hideCookieBanners: input.hideCookieBanners ?? true,
        timeoutSecs: Math.min(Math.max(Number(input.timeoutSecs ?? 45), 10), 180),
        maxConcurrency: Math.min(Math.max(Number(input.maxConcurrency ?? 3), 1), 10),
    };
}

const dnsCache = new Map();
async function hostIsPublic(host) {
    const h = host.replace(/^\[|\]$/g, '');
    if (net.isIP(h)) return isPublicIp(h);
    if (!dnsCache.has(h)) {
        dnsCache.set(h, lookup(h, { all: true }).then((a) => a.every((x) => isPublicIp(x.address))).catch(() => true));
    }
    return dnsCache.get(h);
}

/** Render one job. Every request the page makes (incl. sub-resources and redirects) is checked against private IPs. */
export async function renderJob(browser, job, cfg, { allowPrivate = false } = {}) {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    const blocked = [];
    try {
        const dev = DEVICES[cfg.device];
        await page.setViewport(dev);
        if (dev.isMobile) await page.setUserAgent(MOBILE_UA);
        await page.setRequestInterception(true);
        page.on('request', async (req) => {
            try {
                const u = new URL(req.url());
                if (['data:', 'blob:', 'about:'].includes(u.protocol)) return req.continue();
                if (!['http:', 'https:'].includes(u.protocol)) { blocked.push(req.url().slice(0, 100)); return req.abort('accessdenied'); }
                if (!allowPrivate && !(await hostIsPublic(u.hostname))) { blocked.push(u.hostname); return req.abort('accessdenied'); }
                return req.continue();
            } catch {
                return req.abort('failed').catch(() => {});
            }
        });
        const timeout = cfg.timeoutSecs * 1000;
        let status = null;
        if (job.url) {
            const resp = await page.goto(job.url, { waitUntil: cfg.waitUntil, timeout });
            status = resp?.status() ?? null;
            if (status === null && blocked.length) throw new Error(`Navigation blocked (non-public address: ${blocked[0]})`);
        } else {
            await page.setContent(job.html, { waitUntil: cfg.waitUntil, timeout });
        }
        if (cfg.hideCookieBanners) await page.addStyleTag({ content: COOKIE_HIDE_CSS }).catch(() => {});
        if (cfg.delayMs) await new Promise((r) => setTimeout(r, cfg.delayMs));
        const title = await page.title().catch(() => null);
        const out = { status, title, finalUrl: job.url ? page.url() : null, blockedRequests: blocked.length };
        if (cfg.outputs.includes('screenshot')) {
            const opts = { type: cfg.screenshotFormat, fullPage: cfg.fullPage, captureBeyondViewport: cfg.fullPage };
            if (cfg.screenshotFormat !== 'png') opts.quality = cfg.quality;
            out.screenshot = Buffer.from(await page.screenshot(opts));
        }
        if (cfg.outputs.includes('pdf')) {
            out.pdf = Buffer.from(await page.pdf({
                format: cfg.pdfFormat, landscape: cfg.landscape, printBackground: cfg.printBackground,
                margin: { top: cfg.margin, bottom: cfg.margin, left: cfg.margin, right: cfg.margin }, timeout,
            }));
        }
        return out;
    } finally {
        await ctx.close().catch(() => {});
    }
}
