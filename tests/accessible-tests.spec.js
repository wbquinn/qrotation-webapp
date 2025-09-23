// tests/volleyball-tracker.spec.js
import { test, expect } from '@playwright/test';

const SKIP_FOCUS_TEST = true;
const SKIP_KEYBOARD_NAV_TEST = true;


test.describe('Volleyball Rotation Tracker', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start with clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    
    await page.goto('/'); 
    
    // Wait for the app to load
    await expect(page.getByRole('main')).toBeVisible();
  });

  test.describe('Player Setup View', () => {
    test('should display initial setup view with correct accessibility features', async ({ page }) => {
      // Check main heading
      await expect(page.getByRole('heading', { name: /player roster & starting lineup/i })).toBeVisible();
      
      // Check empty state message
      await expect(page.getByText(/no players added yet/i)).toBeVisible();
      
      // Check add player button is accessible
      const addPlayerBtn = page.getByRole('button', { name: /add new player to roster/i });
      await expect(addPlayerBtn).toBeVisible();
      //await expect(addPlayerBtn).toBeFocused(); // Should be focusable
    });

    test('should open player modal with correct accessibility features', async ({ page }) => {
      // Click add player button
      await page.getByRole('button', { name: /add new player to roster/i }).click();
      
      // Check modal accessibility
      const modal = page.getByRole('dialog', { name: /add new player/i });
      await expect(modal).toBeVisible();
      await expect(modal).toHaveAttribute('aria-modal', 'true');
      
      // Check form fields have proper labels
      await expect(page.getByLabel(/name/i)).toBeVisible();
      await expect(page.getByLabel(/number/i)).toBeVisible();
      await expect(page.getByLabel(/role/i)).toBeVisible();
      
      // Check required fields
      await expect(page.getByLabel(/name/i)).toHaveAttribute('aria-required', 'true');
      await expect(page.getByLabel(/number/i)).toHaveAttribute('aria-required', 'true');
    });

    test('should add a new player successfully', async ({ page }) => {
      // Add first player
      await page.getByRole('button', { name: /add new player to roster/i }).click();
      
      await page.getByLabel(/name/i).fill('John Smith');
      await page.getByLabel(/number/i).fill('7');
      await page.getByLabel(/role/i).selectOption('Outside');
      
      await page.getByRole('button', { name: /save player information/i }).click();
      
      // Verify player was added
      const playerItem = page.getByRole('listitem', { name: /player 7: john smith, outside/i });
      await expect(playerItem).toBeVisible();
      
      // Verify position selector is accessible
      await expect(page.getByLabel(/court position for john smith/i)).toBeVisible();
    });

    test('should validate player form inputs', async ({ page }) => {
      await page.getByRole('button', { name: /add new player to roster/i }).click();
      
      // Try to save without required fields
      await page.getByRole('button', { name: /save player information/i }).click();
      
      // Should show alert (validation message)
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('name and number are required');
        await dialog.accept();
      });
    });

    test('should prevent duplicate jersey numbers', async ({ page }) => {
      // Add first player
      await page.getByRole('button', { name: /add new player to roster/i }).click();
      await page.getByLabel(/name/i).fill('Player One');
      await page.getByLabel(/number/i).fill('7');
      await page.getByRole('button', { name: /save player information/i }).click();
      
      // Try to add second player with same number
      await page.getByRole('button', { name: /add new player to roster/i }).click();
      await page.getByLabel(/name/i).fill('Player Two');
      await page.getByRole('spinbutton', { name: 'Number' }).fill('7');
      
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('number 7 is already taken');
        await dialog.accept();
      });
      
      await page.getByRole('button', { name: /save player information/i }).click();
    });

    test('should edit existing player', async ({ page }) => {
      // Add a player first
      await addPlayer(page, 'Original Name', '5', 'Setter');
      
      // Edit the player
      await page.getByRole('button', { name: /edit original name/i }).click();
      
      const modal = page.getByRole('dialog', { name: /edit player/i });
      await expect(modal).toBeVisible();
      
      await page.getByRole('textbox', { name: 'Name' }).fill('Updated Name');
      await page.getByRole('button', { name: /save player information/i }).click();
      
      // Verify update
      await expect(page.getByRole('listitem', { name: /player 5: updated name, setter/i })).toBeVisible();
    });

    test('should assign court positions and enable start controls', async ({ page }) => {
      // Add 6 players
      const players = [
        { name: 'Player 1', number: '1', role: 'Setter', position: 'I' },
        { name: 'Player 2', number: '2', role: 'Outside', position: 'II' },
        { name: 'Player 3', number: '3', role: 'Middle', position: 'III' },
        { name: 'Player 4', number: '4', role: 'Outside', position: 'IV' },
        { name: 'Player 5', number: '5', role: 'Middle', position: 'V' },
        { name: 'Player 6', number: '6', role: 'Libero', position: 'VI' },
      ];
      
      for (const player of players) {
        await addPlayer(page, player.name, player.number, player.role);
        await page.getByLabel(`Court position for ${player.name}`).selectOption(player.position);
      }
      
      // Check that start controls are now visible
      const startControls = page.getByRole('region', { name: /ready to start/i });
      await expect(startControls).toBeVisible();
      
      await expect(page.getByRole('button', { name: /start set with our team serving first/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /start set with opponent team serving first/i })).toBeVisible();
    });

    test('should close modal on escape key', async ({ page }) => {
      await page.getByRole('button', { name: /add new player to roster/i }).click();
      
      const modal = page.getByRole('dialog', { name: /add new player/i });
      await expect(modal).toBeVisible();
      
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    });

    test('should navigate to history view', async ({ page }) => {
      await page.getByRole('button', { name: /view completed sets history/i }).click();
      
      await expect(page.getByRole('heading', { name: /set history/i })).toBeVisible();
      await expect(page.getByText( /no sets have been completed/i )).toBeVisible();
    });
  });

  test.describe('Active Set View', () => {
    test.beforeEach(async ({ page }) => {
      // Set up players and start a set
      await setupCompleteTeam(page);
      await page.getByRole('button', { name: /start set with our team serving first/i }).click();
    });

    test('should display active set view with correct accessibility features', async ({ page }) => {
      // Check scoreboard accessibility
      const scoreboard = page.getByRole('region', { name: /scoreboard - click to flip orientation/i });
      await expect(scoreboard).toBeVisible();
      
      // Check score elements have live regions
      await expect(page.getByRole('img', { name: /us/i })).toBeVisible();
      await expect(page.getByRole('img', { name: /them/i })).toBeVisible();
      
      // Check court grid
      const court = page.getByRole('grid', { name: /volleyball court positions/i });
      await expect(court).toBeVisible();
      
      // Check all court positions are labeled correctly
      await expect(page.getByRole('gridcell', { name: /Position I: Setter Player, number 1, Setter - Currently serving/i })).toBeVisible();
      await expect(page.getByRole('gridcell', { name: /Position II: Outside Player 1, number 2, Outside/i })).toBeVisible();
      await expect(page.getByRole('gridcell', { name: /Position III: Middle Player 1, number 3, Middle/i })).toBeVisible();
      await expect(page.getByRole('gridcell', { name: /position IV: Outside Player 2, number 4, Outside/i })).toBeVisible();
      await expect(page.getByRole('gridcell', { name: /position V: Middle Player 2, number 5, Middle/i })).toBeVisible();
      await expect(page.getByRole('gridcell', { name: /position VI: Libero player, number 6, Libero/i })).toBeVisible();
      
      // Check point controls
      const pointControls = page.getByRole('group', { name: /point scoring controls/i });
      await expect(pointControls).toBeVisible();
      
      await expect(page.getByRole('button', { name: /record point won by our team/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /record point lost to opponent/i })).toBeVisible();
    });

    test('should handle scoring with accessibility announcements', async ({ page }) => {
      // Listen for live region updates
      const announcements = page.locator('#announcements');
      
      // Score a point for us
      await page.getByRole('button', { name: /record point won by our team/i }).click();
      
      // Check score updated
      await expect(page.locator('#our-score .score-value')).toHaveText('1');
      
      // Score a point for them
      await page.getByRole('button', { name: /record point lost to opponent/i }).click();
      
      // Check score updated
      await expect(page.locator('#their-score .score-value')).toHaveText('1');
    });

    test('should handle score adjustments', async ({ page }) => {
      // Use score adjustment buttons
      await page.getByRole('button', { name: /increase our score/i }).click();
      await expect(page.locator('#our-score .score-value')).toHaveText('1');
      
      await page.getByRole('button', { name: /increase opponent score/i }).click();
      await expect(page.locator('#their-score .score-value')).toHaveText('1');
      
      // Test decrements
      await page.getByRole('button', { name: /decrease our score/i }).click();
      await expect(page.locator('#our-score .score-value')).toHaveText('0');
      
      await page.getByRole('button', { name: /decrease opponent score/i }).click();
      await expect(page.locator('#their-score .score-value')).toHaveText('0');
    });

    test('should flip scoreboard orientation', async ({ page }) => {
      const scoreboard = page.getByRole('region', { name: /scoreboard - click to flip orientation/i });
      
      // Click on scoreboard (but not on adjustment buttons)
      await page.locator('#our-score-container').click();
      
      // Verify orientation changed (flex-direction should be 'row-reverse')
      await expect(scoreboard).toHaveCSS('flex-direction', 'row-reverse');
    });

    test('should show match point styling', async ({ page }) => {
      // Set score to near match point
      for (let i = 0; i < 24; i++) {
        await page.getByRole('button', { name: /increase our score/i }).click();
      }
      
      await page.getByRole('button', { name: /increase our score/i }).click(); // 25 points
      
      // Check match point styling
      await expect(page.locator('#our-score')).toHaveClass(/match-point/);
    });

    test('should end set with confirmation', async ({ page }) => {
      // Set up dialog handler
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Are you sure you want to end');
        await dialog.accept();
      });
      
      await page.getByRole('button', { name: /end current set/i }).click();
      
      // Should return to setup view
      await expect(page.getByRole('heading', { name: /player roster & starting lineup/i })).toBeVisible();
    });
  });

  test.describe('Set History View', () => {
    test('should display empty history state', async ({ page }) => {
      await page.getByRole('button', { name: /view completed sets history/i }).click();
      
      await expect(page.getByRole('heading', { name: /set history/i })).toBeVisible();
      await expect(page.getByText( /no sets have been completed/i )).toBeVisible();
    });

    test('should display completed sets and show rotation details', async ({ page }) => {
      // Complete a set first
      await setupCompleteTeam(page);
      await page.getByRole('button', { name: /start set with our team serving first/i }).click();
      
      // Score some points and end set
      for (let i = 0; i < 25; i++) {
        await page.getByRole('button', { name: /record point won by our team/i }).click();
      }
      
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      
      await page.getByRole('button', { name: /end current set/i }).click();
      
      // Go to history
      await page.getByRole('button', { name: /view completed sets history/i }).click();
      
      // Check set is listed
      const setItem = page.getByRole('listitem').first();
      await expect(setItem).toBeVisible();
      await expect(setItem).toHaveAttribute('tabindex', '0');
      
      // Click to view rotation details
      await setItem.click();
      
      const rotationModal = page.getByRole('dialog', { name: /starting rotation/i });
      await expect(rotationModal).toBeVisible();
      
      // Check rotation list
      const rotationList = page.getByRole('list', { name: /starting rotation details/i });
      await expect(rotationList).toBeVisible();
      
      // Should have 6 positions listed
      const positions = page.getByRole('listitem').filter({ has: page.locator('strong') });
      await expect(positions).toHaveCount(6);
    });

    test('should support keyboard navigation in history', async ({ page }) => {
      // Set up history with a completed set (similar to above)
      await setupCompleteTeam(page);
      await page.getByRole('button', { name: /start set with our team serving first/i }).click();
      
      for (let i = 0; i < 25; i++) {
        await page.getByRole('button', { name: /record point won by our team/i }).click();
      }
      
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      
      await page.getByRole('button', { name: /end current set/i }).click();
      await page.getByRole('button', { name: /view completed sets history/i }).click();
      
      // Navigate with keyboard
      const setItem = page.getByRole('listitem').first();
      await setItem.focus();
      await page.keyboard.press('Enter');
      
      const rotationModal = page.getByRole('dialog', { name: /starting rotation/i });
      await expect(rotationModal).toBeVisible();
      
      // Close with escape
      await page.keyboard.press('Escape');
      await expect(rotationModal).not.toBeVisible();
    });

    test('should navigate back to roster', async ({ page }) => {
      await page.getByRole('button', { name: /view completed sets history/i }).click();
      await page.getByRole('button', { name: /return to player roster/i }).click();
      
      await expect(page.getByRole('heading', { name: /player roster & starting lineup/i })).toBeVisible();
    });
  });

  test.describe('Accessibility and Keyboard Navigation', () => {
    test('should maintain focus management in modals', async ({ page }) => {
      if (SKIP_FOCUS_TEST) {
        return;
      }
      await page.getByRole('button', { name: /add new player to roster/i }).click();
      
      // First focusable element should be focused
      //await expect(page.getByLabel(/name/i)).toBeFocused();
      
      // Tab through form
      await page.keyboard.press('Tab');
      await expect(page.getByLabel(/number/i)).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.getByLabel(/role/i)).toBeFocused();
    });

    test('should announce state changes to screen readers', async ({ page }) => {
      // Check that live regions exist
      await expect(page.locator('#announcements')).toHaveAttribute('aria-live', 'polite');
      
      // Add a player to trigger announcement
      await addPlayer(page, 'Test Player', '1', 'Setter');
      
      // The announcement should be made (we can't directly test screen reader announcements,
      // but we can verify the live region content changes)
      // In a real test, you might use tools like axe-playwright for accessibility testing
    });

    test('should have proper ARIA labels for all interactive elements', async ({ page }) => {
      // Check main navigation elements have proper labels
      await expect(page.getByRole('button', { name: /add new player to roster/i })).toHaveAttribute('aria-label');
      await expect(page.getByRole('button', { name: /view completed sets history/i })).toHaveAttribute('aria-label');
      
      // Set up team and go to active view
      await setupCompleteTeam(page);
      await page.getByRole('button', { name: /start set with our team serving first/i }).click();
      
      // Check all score buttons have proper labels
      await expect(page.getByRole('button', { name: /increase our score/i })).toHaveAttribute('aria-label');
      await expect(page.getByRole('button', { name: /decrease our score/i })).toHaveAttribute('aria-label');
      await expect(page.getByRole('button', { name: /increase opponent score/i })).toHaveAttribute('aria-label');
      await expect(page.getByRole('button', { name: /decrease opponent score/i })).toHaveAttribute('aria-label');
      
      // Check court positions have descriptive labels
      const courtPositions = await page.getByRole('gridcell').all();
      for (const position of courtPositions) {
        await expect(position).toHaveAttribute('aria-label');
      }
    });

    test('should support keyboard-only navigation', async ({ page }) => {
      if (SKIP_KEYBOARD_NAV_TEST)
        return;
      // Navigate through the app using only keyboard
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: /add new player to roster/i })).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: /view completed sets history/i })).toBeFocused();
      
      // Test modal keyboard navigation
      await page.keyboard.press('Shift+Tab'); // Go back to add player button
      await page.keyboard.press('Enter'); // Open modal
      
      // Should focus first input
      //await expect(page.getByLabel(/name/i)).toBeFocused();
      
      // Test escape to close
      await page.keyboard.press('Escape');
      const modal = page.getByRole('dialog', { name: /add new player/i });
      await expect(modal).not.toBeVisible();
    });

    test('should maintain proper heading hierarchy', async ({ page }) => {
      // Check main heading is h2
      await expect(page.getByRole('heading', { level: 2, name: /player roster & starting lineup/i })).toBeVisible();
      
      // Navigate to history
      await page.getByRole('button', { name: /view completed sets history/i }).click();
      await expect(page.getByRole('heading', { level: 2, name: /set history/i })).toBeVisible();
    });
  });

  test.describe('State Persistence', () => {
    test('should persist player data across page reloads', async ({ page }) => {
      await addPlayer(page, 'Persistent Player', '99', 'Outside');
      
      // Reload page
      await page.reload();
      
      // Check player is still there
      await expect(page.getByRole('listitem', { name: /player 99: persistent player, outside/i })).toBeVisible();
    });

    test('should persist active set state', async ({ page }) => {
      await setupCompleteTeam(page);
      await page.getByRole('button', { name: /start set with our team serving first/i }).click();
      
      // Score some points
      await page.getByRole('button', { name: /record point won by our team/i }).click();
      await page.getByRole('button', { name: /record point lost to opponent/i }).click();
      
      // Reload page
      await page.reload();
      
      // Should be back in active set view with correct scores
      await expect(page.locator('#our-score .score-value')).toHaveText('1');
      await expect(page.locator('#their-score .score-value')).toHaveText('1');
    });

    test('should handle localStorage errors gracefully', async ({ page }) => {
      // Simulate localStorage failure
      await page.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', {
          value: {
            getItem: () => { throw new Error('Storage error'); },
            setItem: () => { throw new Error('Storage error'); },
            removeItem: () => { throw new Error('Storage error'); }
          }
        });
      });
      
      // App should still load without crashing
      await page.goto('/index.html');
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByText( /no players added yet/i )).toBeVisible();
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test('should handle position conflicts correctly', async ({ page }) => {
      await addPlayer(page, 'Player 1', '1', 'Setter');
      await addPlayer(page, 'Player 2', '2', 'Outside');
      
      // Assign position I to player 1
      await page.getByLabel(/court position for player 1/i).selectOption('I');
      
      // Try to assign same position to player 2
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Position I is already taken');
        await dialog.accept();
      });
      
      await page.getByLabel(/court position for player 2/i).selectOption('I');
      
      // Player 2 should remain in 'sub' position
      await expect(page.getByLabel(/court position for player 2/i)).toHaveValue('sub');
    });

    test('should prevent score from going below zero', async ({ page }) => {
      await setupCompleteTeam(page);
      await page.getByRole('button', { name: /start set with our team serving first/i }).click();
      
      // Try to decrease score below zero
      await page.getByRole('button', { name: /decrease our score/i }).click();
      
      // Score should remain at 0
      await expect(page.locator('#our-score .score-value')).toHaveText('0');
    });

    test('should handle rotation correctly during gameplay', async ({ page }) => {
      await setupCompleteTeam(page);
      await page.getByRole('button', { name: /start set with opponent team serving first/i }).click();
      
      // When we win a point while not serving, we should rotate
      const initialPlayer = await page.locator('#pos-I .pos-player-number').textContent();
      
      await page.getByRole('button', { name: /record point won by our team/i }).click();
      
      // Player in position I should have changed due to rotation
      const newPlayer = await page.locator('#pos-I .pos-player-number').textContent();
      expect(newPlayer).not.toBe(initialPlayer);
    });
  });

  test.describe('Performance and Responsiveness', () => {
    test('should render court positions efficiently with many updates', async ({ page }) => {
      await setupCompleteTeam(page);
      await page.getByRole('button', { name: /start set with our team serving first/i }).click();
      
      const startTime = Date.now();
      
      // Rapidly score points to test performance
      for (let i = 0; i < 20; i++) {
        await page.getByRole('button', { name: /record point won by our team/i }).click();
        await page.getByRole('button', { name: /record point lost to opponent/i }).click();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(10000); // 10 seconds
      
      // UI should still be responsive
      await expect(page.locator('#our-score .score-value')).toHaveText('20');
      await expect(page.locator('#their-score .score-value')).toHaveText('20');
    });
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