import { test, expect } from '@playwright/test';

// Rauchtest des lokalen Spielflusses: Menü → Setup → laufende Partie.
// Deckt die kritische Verdrahtung im echten Browser ab (3D/WebGL inklusive).
test('lokaler Spielfluss: Menü → Setup → Würfeln', async ({ page }) => {
  await page.goto('/');

  // Menü: Solo/Pass-and-Play starten.
  await expect(page.getByText('Würfelspiel mit Mäuse-Thema')).toBeVisible();
  await page.getByRole('button', { name: /Solo \/ Pass-and-Play/ }).click();

  // Setup: Partie starten (Defaults: 1 Mensch + 1 KI = gültig).
  await expect(page.getByText('Neue Partie einrichten')).toBeVisible();
  await page.getByRole('button', { name: /Partie starten/ }).click();

  // Spielbrett: erste Phase sichtbar.
  await expect(page.getByText('1 · Würfeln')).toBeVisible();
});

// Regeln öffnen und zurück.
test('Regeln öffnen und zurück ins Menü', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Spielregeln/ }).click();
  await expect(page.getByText('Würfel & Wertung')).toBeVisible();
  await page.getByRole('button', { name: /Zurück/ }).click();
  await expect(page.getByText('Würfelspiel mit Mäuse-Thema')).toBeVisible();
});
