import { test, expect } from '@playwright/test';

// End-to-End-Raucher: echter Browser, echter Build. Deckt den lokalen
// Kernablauf + den Einstellungs-Screen ab.

// Erststart zeigt das Tutorial-Overlay – wegklicken, falls vorhanden.
async function dismissTutorial(page: import('@playwright/test').Page) {
  const btn = page.getByRole('button', { name: /Verstanden/ });
  if (await btn.isVisible().catch(() => false)) await btn.click();
}

test('lokaler Kernablauf: Start -> Würfeln -> Phasen weiterschalten', async ({ page }) => {
  await page.goto('/');
  await dismissTutorial(page);

  await expect(page.getByRole('heading', { name: /Dice Mice/ })).toBeVisible();

  await page.getByRole('button', { name: /Solo|Pass-and-Play/ }).click();
  await page.getByRole('button', { name: /Partie starten/ }).click();

  // Phase 1: Würfeln aufdecken, dann weiterschalten.
  await expect(page.getByText('1 · Würfeln')).toBeVisible();
  await page.getByRole('button', { name: /Würfeln/ }).click();
  await page.getByRole('button', { name: 'Weiter →' }).click();

  // Phase 2: Mitleidswürfel.
  await expect(page.getByText('2 · Mitleidswürfel')).toBeVisible();
});

test('Einstellungen lassen sich öffnen und umschalten', async ({ page }) => {
  await page.goto('/');
  await dismissTutorial(page);

  await page.getByRole('button', { name: /Einstellungen/ }).click();
  await expect(page.getByText('Einstellungen')).toBeVisible();

  // Farbenblind-Modus umschalten (Checkbox).
  const cb = page.getByRole('checkbox', { name: /Farbenblind/ });
  await cb.check();
  await expect(cb).toBeChecked();

  await page.getByRole('button', { name: /Zurück/ }).click();
  await expect(page.getByRole('button', { name: /Solo|Pass-and-Play/ })).toBeVisible();
});
