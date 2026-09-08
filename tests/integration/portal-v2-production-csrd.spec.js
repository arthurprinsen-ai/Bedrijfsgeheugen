import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PRODUCTION_URL || 'https://www.bedrijfsgeheugen.nl';

test('production Portal V2 renders the canonical CSRD & Impact module', async ({ page, request }) => {
  const nonce = `${Date.now()}`;
  const response = await page.goto(`${BASE_URL}/portal-v2/?bg_dom_readback=${nonce}`, { waitUntil: 'networkidle', timeout: 60_000 });
  expect(response, 'Portal V2 must return an HTTP response').not.toBeNull();
  expect(response.status(), 'Portal V2 must be reachable').toBeLessThan(400);
  const csrdNav = page.getByRole('button', { name: /CSRD & Impact/ }).first();
  await expect(csrdNav).toBeVisible();
  await csrdNav.click();
  await expect(page.getByText('CSRD Readiness', { exact: true })).toBeVisible();
  await expect(page.getByText('Voorbeelddata · geen live claim', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sluit CSRD dashboard' })).toBeVisible();
  const bodyText = await page.locator('body').innerText();
  for (const text of ['CO₂ & Klimaat','Water','Circulariteit','Social','Governance']) expect(bodyText).toContain(text);
  expect(bodyText).not.toMatch(/●\s*Live data/i);
  expect(bodyText).not.toMatch(/audit-ready/i);
  for (const asset of ['/portal-v2/csrd-impact.js','/portal-v2/csrd-impact.css']) {
    const assetResponse = await request.get(`${BASE_URL}${asset}?bg_dom_readback=${nonce}`);
    expect(assetResponse.status(), `${asset} must be served`).toBe(200);
    expect((await assetResponse.body()).byteLength, `${asset} must not be empty`).toBeGreaterThan(100);
  }
});
