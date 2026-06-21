import { test, expect, type Page } from '@playwright/test';

// Online-Pfad ohne echten Server: ohne Server-URL nutzt die App den In-Process-
// Loopback (LocalTransport), sodass derselbe autoritative Code-Pfad im Browser
// läuft. Deckt Verbinden → Lobby → Partiestart → erste Aktion ab.

async function dismissTutorial(page: Page) {
  const btn = page.getByRole('button', { name: /Verstanden/ });
  if (await btn.isVisible().catch(() => false)) await btn.click();
}

test('Online-Loopback: Raum erstellen, starten und eine Aktion senden', async ({ page }) => {
  await page.goto('/');
  await dismissTutorial(page);

  await page.getByRole('button', { name: /Online spielen/ }).click();
  await expect(page.getByRole('heading', { name: /Online/ })).toBeVisible();

  // Server-URL bleibt leer → lokaler Loopback. Raum mit der Standard-KI erstellen.
  await page.getByRole('button', { name: 'Raum erstellen →' }).click();

  // Lobby: Host kann mit 2 Mäusen (Mensch + KI) starten.
  await expect(page.getByRole('heading', { name: /Lobby/ })).toBeVisible();
  await page.getByRole('button', { name: 'Partie starten →' }).click();

  // Online-Partie läuft: erste Phase sichtbar, Würfeln aufdecken und weiterschalten.
  await expect(page.getByText('1 · Würfeln')).toBeVisible();
  await page.getByRole('button', { name: 'Würfeln und Wurf aufdecken' }).click();
  await page.getByRole('button', { name: 'Weiter →' }).click();
  await expect(page.getByText('2 · Mitleidswürfel')).toBeVisible();
});
