// Apify entrypoint: URLs / HTML -> PDF and screenshots stored in the key-value store.
import { createHash } from 'node:crypto';
import { Actor, log } from 'apify';
import { launchBrowser, parseInput, renderJob } from './render.js';

const EV_SHOT = 'screenshot-taken';
const EV_PDF = 'pdf-generated';

await Actor.init();
try {
    const input = (await Actor.getInput()) ?? {};
    let cfg;
    try { cfg = parseInput(input); } catch (e) { await Actor.fail(e.message); }
    const allowPrivate = process.env.ALLOW_PRIVATE_NETWORK_FOR_LOCAL_DEV === '1' && !Actor.isAtHome();
    for (const bad of cfg.invalid) await Actor.pushData(bad);
    const store = await Actor.openKeyValueStore();
    let browser = await launchBrowser();
    let next = 0; let done = 0; let budgetHit = false;
    const mime = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' };

    const charge = async (eventName) => {
        const r = await Actor.charge({ eventName });
        if (r.chargedCount === 0 && r.eventChargeLimitReached) { budgetHit = true; return false; }
        if (r.eventChargeLimitReached) budgetHit = true;
        return true;
    };

    const worker = async () => {
        while (!budgetHit && next < cfg.jobs.length) {
            const job = cfg.jobs[next++];
            const id = createHash('sha1').update(job.url ?? job.html).digest('hex').slice(0, 12);
            const base = job.url ? new URL(job.url).hostname.replace(/[^a-z0-9.-]/gi, '-') : job.name;
            const item = job.url ? { url: job.url } : { htmlName: job.name };
            try {
                if (!browser.connected) browser = await launchBrowser();
                const r = await renderJob(browser, job, cfg, { allowPrivate });
                Object.assign(item, { status: r.status, title: r.title, finalUrl: r.finalUrl, blockedRequests: r.blockedRequests });
                if (r.status && r.status >= 400) item.warning = `Page returned HTTP ${r.status}`;
                if (r.screenshot && await charge(EV_SHOT)) {
                    const key = `${base}-${id}-${cfg.device}.${cfg.screenshotFormat === 'jpeg' ? 'jpg' : cfg.screenshotFormat}`;
                    await store.setValue(key, r.screenshot, { contentType: mime[cfg.screenshotFormat] });
                    Object.assign(item, { screenshotKey: key, screenshotUrl: store.getPublicUrl(key), screenshotBytes: r.screenshot.length });
                }
                if (r.pdf && !budgetHit && await charge(EV_PDF)) {
                    const key = `${base}-${id}.pdf`;
                    await store.setValue(key, r.pdf, { contentType: 'application/pdf' });
                    Object.assign(item, { pdfKey: key, pdfUrl: store.getPublicUrl(key), pdfBytes: r.pdf.length });
                }
            } catch (e) {
                item.error = String(e?.message ?? e).slice(0, 300);
            }
            await Actor.pushData(item);
            done += 1;
            await Actor.setStatusMessage(`Rendered ${done}/${cfg.jobs.length}`);
        }
    };
    await Promise.all(Array.from({ length: Math.min(cfg.maxConcurrency, cfg.jobs.length) }, worker));
    await browser.close().catch(() => {});
    log.info(`Finished ${done} job(s)`);
    await Actor.setStatusMessage(`Done: ${done}/${cfg.jobs.length}${budgetHit ? ' (stopped: max charge reached)' : ''}`, { isStatusMessageTerminal: true });
} catch (e) {
    log.exception(e, 'Run failed');
    await Actor.fail(String(e?.message ?? e));
}
await Actor.exit();
