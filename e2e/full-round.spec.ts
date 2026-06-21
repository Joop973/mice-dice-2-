import { test, expect, type Page } from '@playwright/test';

// Spielt den lokalen Solo-Modus durch einen kompletten Phasenzyklus (Würfeln →
// Mitleidswürfel/Tausch → Draft → Wertung) bis Runde 2 beginnt. Deckt damit die
// Draft-Interaktion und die Rundenauswertung ab, die der Smoke-Test nicht erreicht.

async function dismissTutorial(page: Page) {
  const btn = page.getByRole('button', { name: /Verstanden/ });
  if (await btn.isVisible().catch(() => false)) await btn.click();
}

test('voller Phasenzyklus einer Runde bis zur Wertung', async ({ page }) => {
  await page.goto('/');
  await dismissTutorial(page);

  await page.getByRole('button', { name: /Solo|Pass-and-Play/ }).click();
  await page.getByRole('button', { name: /Partie starten/ }).click();
  await expect(page.getByText('1 · Würfeln')).toBeVisible();

  // Klick-Schleife: in jeder Phase die jeweils verfügbare Aktion ausführen, bis
  // Runde 2 erreicht ist. Bewusst robust gehalten (kein fester Phasenpfad).
  const round2 = page.getByText(/Runde 2 \//);
  for (let i = 0; i < 60; i++) {
    if (await round2.isVisible().catch(() => false)) break;

    const roll = page.getByRole('button', { name: 'Würfeln und Wurf aufdecken' });
    if (await roll.isVisible().catch(() => false)) {
      await roll.click();
      continue;
    }

    // Im Draft das erste verfügbare Angebot nehmen.
    const pick = page.locator('button.draft-die:not([disabled])').first();
    if (await pick.isVisible().catch(() => false)) {
      await pick.click();
      continue;
    }

    // Sonst zur nächsten Phase weiterschalten.
    const weiter = page.getByRole('button', { name: 'Weiter →' });
    if ((await weiter.isVisible().catch(() => false)) && (await weiter.isEnabled())) {
      await weiter.click();
      continue;
    }

    await page.waitForTimeout(150); // KI denkt / Animationen
  }

  await expect(round2).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Rundenauswertung' })).toBeVisible();
});
