import { expect, test, type Page } from '@playwright/test';

/** Échoue le test si la console émet une erreur (qualité §13). */
function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

const simSeconds = async (page: Page) => Number(await page.getByTestId('sim-time').getAttribute('data-seconds'));

async function waitForSimSecond(page: Page, min: number) {
  await expect.poll(() => simSeconds(page), { timeout: 30_000 }).toBeGreaterThanOrEqual(min);
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('AC-01 : huit patients, mention de simulation, démarrage et pause', async ({ page }) => {
  const errors = trackConsoleErrors(page);
  await expect(page.getByText('SIMULATION — NE PAS UTILISER POUR DES SOINS')).toBeVisible();
  await expect(page.locator('[data-testid^="patient-card-"]')).toHaveCount(8);
  await expect(page.getByTestId('sim-time')).toHaveText('00:00:00');

  await page.getByRole('button', { name: /Démarrer/ }).click();
  await expect(page.getByTestId('sim-state')).toHaveText('En cours');
  await waitForSimSecond(page, 2);
  await page.getByRole('button', { name: /Pause/ }).click();
  const frozen = await simSeconds(page);
  await page.waitForTimeout(1500);
  expect(await simSeconds(page)).toBe(frozen);

  // UI-REQ-001 : aucune carte ne déborde horizontalement en 1366 × 768.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  expect(errors).toEqual([]);
});

test('SC-02 : alarme visible puis acquittable', async ({ page }) => {
  const errors = trackConsoleErrors(page);
  await page.getByLabel('Scénario de Patient 02').selectOption('SC-02');
  await page.getByText('×10').click();
  await page.getByRole('button', { name: /Démarrer/ }).click();
  const card = page.getByTestId('patient-card-P-002');
  await expect(card.getByText('CRITIQUE')).toBeVisible({ timeout: 60_000 });

  await page.getByRole('button', { name: /Pause/ }).click();
  await page.getByRole('link', { name: /Centre d'alarmes/ }).click();
  const table = page.getByRole('table', { name: 'Alarmes non résolues' });
  const firstAck = table.getByRole('button', { name: /Acquitter l'alarme/ }).first();
  const label = await firstAck.getAttribute('aria-label');
  await firstAck.click();
  await expect(page.getByRole('button', { name: label ?? '' })).toBeDisabled();
  await expect(table.getByText('Acquittée').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('AC-04 : override maintenu pendant 30 s simulées', async ({ page }) => {
  const errors = trackConsoleErrors(page);
  await page.getByRole('link', { name: /Patient 01/ }).click();
  const row = page.getByTestId('override-heartRate');
  await row.getByRole('textbox').fill('125');
  await row.getByRole('button', { name: 'Imposer' }).click();
  await expect(row.getByText('MANUEL')).toBeVisible();
  await expect(page.getByRole('table', { name: 'Alarmes non résolues' }).getByText('CRITIQUE')).toBeVisible();

  await page.getByText('×10').click();
  await page.getByRole('button', { name: /Démarrer/ }).click();
  await waitForSimSecond(page, 30);
  await expect(row.getByText('125 bpm')).toBeVisible();
  await expect(row.getByText('MANUEL')).toBeVisible();
  await expect(page.getByTestId('chart-heartRate')).toBeVisible();

  await row.getByRole('button', { name: 'Libérer' }).click();
  await expect(row.getByText('MANUEL')).toHaveCount(0);
  await page.getByRole('button', { name: /Pause/ }).click();
  await expect(page.getByText('Aucune alarme non résolue.')).toBeVisible();
  expect(errors).toEqual([]);
});

test('AC-10 : rechargement avec persistance limitée', async ({ page }) => {
  await page.getByText('×5').click();
  await page.getByRole('button', { name: /Démarrer/ }).click();
  await page.getByRole('link', { name: /Patient 03/ }).click();
  const row = page.getByTestId('override-spo2');
  await row.getByRole('textbox').fill('85');
  await row.getByRole('button', { name: 'Imposer' }).click();
  await waitForSimSecond(page, 10);

  await page.reload();
  await page.goto('./');
  await expect(page.getByRole('radio', { name: '×5' })).toBeChecked();
  await expect(page.getByTestId('sim-time')).toHaveText('00:00:00');
  await expect(page.getByTestId('sim-state')).toHaveText('Initialisée');
  await expect(page.getByTestId('patient-card-P-003').getByText('MANUEL')).toHaveCount(0);
  await page.getByRole('link', { name: 'Journal' }).click();
  await expect(page.getByText('Aucun événement.')).toBeVisible();
});

test('SIM-007 : pause automatique quand l’onglet est masqué', async ({ page }) => {
  await page.getByRole('button', { name: /Démarrer/ }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByTestId('sim-state')).toHaveText('En pause');
  await page.getByRole('link', { name: 'Journal' }).click();
  await expect(page.getByRole('cell', { name: 'Pause automatique (onglet masqué)' })).toBeVisible();
});
