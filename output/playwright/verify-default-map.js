await page.goto('http://localhost:5173/map', { waitUntil: 'domcontentloaded' });
await page.evaluate(() => {
  localStorage.removeItem('lvyou-last-city');
  localStorage.setItem('lvyou-map-language', 'zh_cn');
});
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);
console.log('url-before', page.url());
console.log('marker-count', await page.locator('div.amap-marker').count());
await page.locator('div.amap-marker').nth(1).click({ force: true });
await page.waitForTimeout(5000);
console.log('url-after', page.url());
console.log('province-title', await page.locator('.map-toolbar-card h3').textContent().catch(() => null));
console.log('loading-overlay', await page.locator('.map-shell__loading').count());
await page.screenshot({ path: 'D:/lvyou/output/playwright/province-default-map.png', fullPage: true });
