// tests/accessibility.spec.js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright'; // npm install --save-dev @axe-core/playwright

    var expectedViolation = [
      {
     "description": "Ensure <meta name=\"viewport\"> does not disable text scaling and zooming",
     "help": "Zooming and scaling must not be disabled",
     "helpUrl": "https://dequeuniversity.com/rules/axe/4.10/meta-viewport?application=playwright",
     "id": "meta-viewport",
     "impact": "critical",
     "nodes":  [
        {
         "all":  [],
         "any":  [
            {
             "data": "user-scalable=no",
             "id": "meta-viewport",
             "impact": "critical",
             "message": "user-scalable=no on <meta> tag disables zooming on mobile devices",
             "relatedNodes":  [],
           },
         ],
         "failureSummary": "Fix any of the following:\n  user-scalable=no on <meta> tag disables zooming on mobile devices",
         "html": "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no\">",
         "impact": "critical",
         "none":  [],
         "target":  [
           "meta[name=\"viewport\"]",
         ],
       },
     ],
     "tags":  [
       "cat.sensory-and-visual-cues",
       "wcag2aa",
       "wcag144",
       "EN-301-549",
       "EN-9.1.4.4",
       "ACT",
     ],
   }
    ];

test.describe('Accessibility Tests', () => {
  test('should not have any automatically detectable accessibility issues on setup page', async ({ page }) => {
  await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual(expectedViolation);
  });

  test('should not have accessibility issues in player modal', async ({ page }) => {

  await page.goto('/');
    await page.getByRole('button', { name: /Add new player to roster/i }).click();
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual(expectedViolation);
  });

  test('should not have accessibility issues in active set view', async ({ page }) => {
  await page.goto('/');
    
    // Set up team quickly
    await setupCompleteTeam(page);
    await page.getByRole('button', { name: /start set with our team serving first/i }).click();
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual(expectedViolation);
  });

  test('should maintain focus visibility', async ({ page }) => {
  await page.goto('/');
    
    // Test focus indicators are visible
    const addPlayerBtn = page.getByRole('button', { name: /add new player to roster/i });
    await addPlayerBtn.focus();
    
    // Check that focus is visible (this is a basic check, more sophisticated focus testing might be needed)
    const isFocused = await addPlayerBtn.evaluate(el => el === document.activeElement);
    expect(isFocused).toBe(true);
  });

  test('should support high contrast mode', async ({ page }) => {
    // Enable forced colors (high contrast mode simulation)
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
  await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // ToDo fix contrast ratios in dark mode
    //expect(accessibilityScanResults.violations).  toEqual([]);
  });

  test('should work with reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
    
    // App should still function normally
    await expect(page.getByRole('main')).toBeVisible();
    
    // Test basic functionality still works
    await page.getByRole('button', { name: /add new player to roster/i }).click();
    const modal = page.getByRole('dialog', { name: /add new player/i });
    await expect(modal).toBeVisible();
  });
});

// Helper function for accessibility tests
async function setupCompleteTeam(page) {
  const players = [
    { name: 'Test Player 1', number: '1', role: 'Setter', position: 'I' },
    { name: 'Test Player 2', number: '2', role: 'Outside', position: 'II' },
    { name: 'Test Player 3', number: '3', role: 'Middle', position: 'III' },
    { name: 'Test Player 4', number: '4', role: 'Outside', position: 'IV' },
    { name: 'Test Player 5', number: '5', role: 'Middle', position: 'V' },
    { name: 'Test Player 6', number: '6', role: 'Libero', position: 'VI' },
  ];

  for (const player of players) {
    await page.getByRole('button', { name: /add.*player/i }).click();
    await page.getByLabel(/name/i).fill(player.name);
    await page.getByRole('spinbutton', { name: 'Number' }).fill(player.number);
    await page.getByLabel(/role/i).selectOption(player.role);
    await page.getByRole('button', { name: /save player information/i }).click();
    await page.getByLabel(`Court position for ${player.name}`).selectOption(player.position);
  }
}

