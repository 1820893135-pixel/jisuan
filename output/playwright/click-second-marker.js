async function(page) {
  await page.locator('div.amap-marker').nth(1).click({ force: true });
}
