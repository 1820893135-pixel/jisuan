async function(page) {
  await page.locator('div.amap-marker[title="ÃÏΩÚ –"]').click({ force: true });
}
