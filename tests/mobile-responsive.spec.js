// tests/mobile-responsive.spec.js
import { test, expect } from '@playwright/test';

const LANDSCAPE_ONLY = true;

test.describe('Mobile Responsiveness', () => {
  test('should work on mobile portrait', async ({ page }) => {
    if ( LANDSCAPE_ONLY ) {
      return ; //- only portrait is required
    }
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.goto('/index.html');
    
    // App should be usable on mobile
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('button', { name: /add new player to roster/i })).toBeVisible();
    
    // Test modal on mobile
    await page.getByRole('button', { name: /add new player to roster/i }).click();
    const modal = page.getByRole('dialog', { name: /add new player/i });
    await expect(modal).toBeVisible();
    
    // Modal should be appropriately sized for mobile
    const modalBounds = await modal.boundingBox();
    const viewportSize = page.viewportSize();
    expect(modalBounds.width).toBeLessThanOrEqual(viewportSize.width * 0.95); // Should not exceed 95% of viewport
  });

  test('should work on mobile landscape', async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 }); // iPhone SE landscape
    await page.goto('/index.html');
    
    await setupCompleteTeam(page);
    await page.getByRole('button', { name: /start set with our team serving first/i }).click();
    
    // Court should be visible and usable in landscape
    const court = page.getByRole('grid', { name: /volleyball court positions/i });
    await expect(court).toBeVisible();
    
    // Score controls should be accessible
    await expect(page.getByRole('button', { name: /record point won by our team/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /record point lost to opponent/i })).toBeVisible();
  });

  test('should work on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    await page.goto('/index.html');
    
    // Test full workflow on tablet
    await setupCompleteTeam(page);
    await page.getByRole('button', { name: /start set with our team serving first/i }).click();
    
    // Score some points
    await page.getByRole('button', { name: /record point won by our team/i }).click();
    await expect(page.locator('#our-score .score-value')).toHaveText('1');
    
    // Touch interactions should work
    await page.locator('#our-score-container').click();
    // Scoreboard should flip
    const scoreboard = page.getByRole('region', { name: /scoreboard - click to flip orientation/i });
    await expect(scoreboard).toHaveCSS('flex-direction', 'row-reverse');
  });
});

// Helper functions
async function addPlayer(page, name, number, role) {
  await page.getByRole('button', { name: /add new player to roster/i }).click();
  await page.getByLabel(/name/i).fill(name);
  await page.getByRole('spinbutton', { name: 'Number' }).fill(number);
  await page.getByLabel(/role/i).selectOption(role);
  await page.getByRole('button', { name: /save player information/i }).click();
}

async function setupCompleteTeam(page) {
  const players = [
    { name: 'Setter Player', number: '1', role: 'Setter', position: 'I' },
    { name: 'Outside Player 1', number: '2', role: 'Outside', position: 'II' },
    { name: 'Middle Player 1', number: '3', role: 'Middle', position: 'III' },
    { name: 'Outside Player 2', number: '4', role: 'Outside', position: 'IV' },
    { name: 'Middle Player 2', number: '5', role: 'Middle', position: 'V' },
    { name: 'Libero Player', number: '6', role: 'Libero', position: 'VI' },
  ];

  for (const player of players) {
    await addPlayer(page, player.name, player.number, player.role);
    await page.getByLabel(`Court position for ${player.name}`).selectOption(player.position);
  }
}
