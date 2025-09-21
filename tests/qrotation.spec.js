import { test, expect } from '@playwright/test';

// Helper function to add a player
async function addPlayer(page, name, number, role) {    
  await page.getByRole('button', { name: /add new player to roster/i }).click();

//await page.getByRole('button', { name: 'Add Player' }).click();
  await page.getByLabel('Name').fill(name);
  await page.getByRole('spinbutton', { name: 'Number' }).fill(number);
  await page.getByLabel('Role').selectOption(role);
  await page.getByRole('button', { name: 'Save Player' }).click();
}

test.beforeEach(async ({ page }) => {
  // Go to the page and clear local storage for a clean slate
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  // Reload to apply the cleared storage
  await page.goto('/');
});

test.describe('Player Roster Management', () => {
  test('should allow adding a player to the roster', async ({ page }) => {
    await addPlayer(page, 'Alice', '10', 'Setter');
    const playerItem = page.locator('.player-item');
    await expect(playerItem).toBeVisible();
    await expect(playerItem.getByText('Alice', { exact: true })).toBeVisible();
    await expect(playerItem.getByText('10')).toBeVisible();
    await expect(playerItem.getByText('Setter')).toBeVisible();
  });

  test('should allow editing a player', async ({ page }) => {
    await addPlayer(page, 'Bob', '5', 'Middle');
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByLabel('Name').fill('Robert');
    await page.getByRole('spinbutton', { name: 'Number' }).fill('15');

    // await page.getByLabel('number').fill('15');
    await page.getByRole('button', { name: 'Save Player' }).click();

    const playerItem = page.locator('.player-item');
    await expect(playerItem.getByText('Bob')).not.toBeVisible();
    await expect(playerItem.getByText('Robert', { exact: true })).toBeVisible();
    await expect(playerItem.getByText('15')).toBeVisible();
  });
});

test.describe('Set Management and Gameplay', () => {
  // Pre-populate players for gameplay tests
  test.beforeEach(async ({ page }) => {
    await addPlayer(page, 'Player I', '1', 'Setter');
    await addPlayer(page, 'Player II', '2', 'Outside');
    await addPlayer(page, 'Player III', '3', 'Middle');
    await addPlayer(page, 'Player IV', '4', 'Opposite');
    await addPlayer(page, 'Player V', '5', 'Outside');
    await addPlayer(page, 'Player VI', '6', 'Middle');
  });

  test('should allow starting a set once 6 positions are filled', async ({ page }) => {
    // Start Set button should be hidden initially
    await expect(page.getByRole('button', { name: 'Start Set (We Serve First)' })).toBeHidden();

    // Assign positions
    const playerItems = await page.locator('.player-item').all();
    await playerItems[0].locator('select').selectOption('I');
    await playerItems[1].locator('select').selectOption('II');
    await playerItems[2].locator('select').selectOption('III');
    await playerItems[3].locator('select').selectOption('IV');
    await playerItems[4].locator('select').selectOption('V');
    await playerItems[5].locator('select').selectOption('VI');
    
    // Start Set button should now be visible
    <button id="start-serving-btn" class="btn-success" aria-label="Start set with our team serving first">Start Set (We Serve First)</button>

    await expect(page.getByRole('button', { name: /start set with our team serving first/i })).toBeVisible();
    
    await page.getByRole('button', { name: /start set with our team serving first/i }).click();

    // Assert we are in the active set view
    await expect(page.locator('#active-set-view')).toBeVisible();
    await expect(page.locator('#player-setup-view')).toBeHidden();

    // Assert players are in the correct court positions
    await expect(page.locator('#pos-I')).toContainText('Player I');
    await expect(page.locator('#pos-II')).toContainText('Player II');
  });

  test('should correctly handle scoring and rotation', async ({ page }) => {
    // Assign positions and start the set (receiving)
    const playerItems = await page.locator('.player-item').all();
    await playerItems[0].locator('select').selectOption('I');
    await playerItems[1].locator('select').selectOption('II');
    await playerItems[2].locator('select').selectOption('III');
    await playerItems[3].locator('select').selectOption('IV');
    await playerItems[4].locator('select').selectOption('V');
    await playerItems[5].locator('select').selectOption('VI');
    await page.getByRole('button', { name: /start set with our team serving first/i }).click();

    //await page.getByRole('button', { name: 'Start Set (We Receive First)' }).click();

    // Initial state check
    await expect(page.locator('#pos-I')).toContainText('Player I');
    await expect(page.locator('#pos-II')).toContainText('Player II');
    
    // 1. Point Lost (no rotation)
    await page.getByRole('button', { name: 'Point Lost' }).click();
    await expect(page.locator('#their-score .score-value')).toHaveText('1');
    await expect(page.locator('#our-score .score-value')).toHaveText('0');
    await expect(page.locator('#pos-I')).toContainText('Player I');
    await expect(page.locator('#pos-II')).toContainText('Player II');
    
    // 2. Point Won (Side-out, should rotate)
    await page.getByRole('button', { name: 'Point Won' }).click();
    await expect(page.locator('#our-score .score-value')).toHaveText('1');
    await expect(page.locator('#pos-I')).toContainText('Player II'); // Player II rotates to I
    await expect(page.locator('#pos-VI')).toContainText('Player I'); // Player I rotates to VI

    // 3. Point Won again (Serving, no rotation)
    await page.getByRole('button', { name: 'Point Won' }).click();
    await expect(page.locator('#our-score .score-value')).toHaveText('2');
    await expect(page.locator('#pos-I')).toContainText('Player II'); // Positions remain the same
    await expect(page.locator('#pos-VI')).toContainText('Player I');
  });

  test('should end a set, save it to history, and show the starting rotation', async ({ page }) => {
    // Assign positions and start the set
    const playerItems = await page.locator('.player-item').all();
    await playerItems[0].locator('select').selectOption('I'); // Player I starts at I
    await playerItems[1].locator('select').selectOption('II');
    await playerItems[2].locator('select').selectOption('III');
    await playerItems[3].locator('select').selectOption('IV');
    await playerItems[4].locator('select').selectOption('V');
    await playerItems[5].locator('select').selectOption('VI');
    await page.getByRole('button', { name: /start set with our team serving first/i }).click();

    //await page.getByRole('button', { name: 'Start Set (We Serve First)' }).click();

    // Score some points
    await page.getByRole('button', { name: 'Point Won' }).click();
    await page.getByRole('button', { name: 'Point Lost' }).click();
    await page.getByRole('button', { name: 'Point Won' }).click();
    
    await expect(page.locator('#our-score .score-value')).toHaveText('2');
    await expect(page.locator('#their-score .score-value')).toHaveText('1');

    // End the set
    page.on('dialog', dialog => dialog.accept()); // Auto-accept the confirmation dialog
      await page.getByRole('button', { name: /end current set/i }).click();
//    await page.getByRole('button', { name: 'End Set' }).click();
    
    // Assert we are back in the setup view
    await expect(page.locator('#player-setup-view')).toBeVisible();

    // Go to history
    await page.getByRole('button', { name: /view completed sets history/i }).click();
    await expect(page.locator('#history-view')).toBeVisible();

    // Check if the set is listed with the correct score
    const setItem = page.locator('.completed-set-item');
    await expect(setItem).toContainText('2 - 1');

    // Click the set to see the rotation pop-up
    await setItem.click();
    await expect(page.locator('#rotation-modal')).toBeVisible();

    // Assert the pop-up shows the correct starting player for position I
    await expect(page.locator('#rotation-popup-list')).toContainText('I: #1 Player I');
  });
});