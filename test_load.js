const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('response', response => {
        if (!response.ok()) {
            console.log('RESPONSE FAILED:', response.url(), response.status());
        }
    });

    try {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    } catch(e) {
        console.log("Goto error:", e.message);
    }
    await browser.close();
})();
