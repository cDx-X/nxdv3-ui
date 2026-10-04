import { expect, test } from '@playwright/test';

/**
 * Browser-level smoke tests for the public dashboard.
 *
 * These run without a wallet: the app renders its disconnected state, which is
 * exactly what an unauthenticated visitor sees. Wallet-driven flows live in
 * `deposit-flow.spec.ts`.
 */

test.describe('dashboard shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('renders the hero, header navigation and wallet call to action', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'NXDv3 Protocol & Staking Hub' })).toBeVisible();
    await expect(page.getByText('Deflationary DXNv2 Derivative')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Charts' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Connect Wallet' }).first()).toBeVisible();
  });

  test('shows both contract cards in their disconnected state', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'NXDv3Protocol - Deposit DXN' })).toBeVisible();
    await expect(
      page.getByText("Connect your wallet to view and use the protocol's deposit features.")
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { name: 'NXDv3StakingVault - NXDv3 Staking' })
    ).toBeVisible();
    await expect(
      page.getByText('Connect your wallet to manage staking and ETH rewards.')
    ).toBeVisible();

    // Deposit controls must not be reachable before the wallet is connected.
    await expect(page.locator('#depositAmount')).toHaveCount(0);
    await expect(page.locator('#stakeAmount')).toHaveCount(0);
  });

  test('opens the lazy-loaded charts hub and returns to the dashboard', async ({ page }) => {
    await page.getByRole('button', { name: 'Charts' }).click();

    await expect(
      page.getByRole('heading', { name: 'NXDv3 Protocol — Economic Charts Hub' })
    ).toBeVisible();
    await expect(page.getByText('Epoch Burn Dynamics')).toBeVisible();

    await page.getByRole('button', { name: 'Back to Dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'NXDv3 Protocol & Staking Hub' })).toBeVisible();
  });

  test('opens and closes info modals from the footer', async ({ page }) => {
    // Litepaper modal
    await page.getByRole('button', { name: 'Litepaper' }).click();
    await expect(page.getByRole('heading', { name: /Litepaper/i })).toBeVisible();
    await page.getByRole('button', { name: 'Close Litepaper' }).click();
    await expect(page.getByRole('heading', { name: /Litepaper/i })).toHaveCount(0);

    // Why v3 modal
    await page.getByRole('button', { name: 'Why v3?' }).click();
    await expect(page.getByRole('heading', { name: /NXDv3 Protocol Architecture/i })).toBeVisible();
    await page.getByRole('button', { name: 'Close Whitepaper' }).click();
    await expect(page.getByRole('heading', { name: /NXDv3 Protocol Architecture/i })).toHaveCount(0);

    // Terms modal
    await page.getByRole('button', { name: 'Terms & Disclaimer' }).click();
    await expect(page.getByRole('heading', { name: /Terms of Service/i })).toBeVisible();
    await page.getByRole('button', { name: 'Close Terms' }).click();
    await expect(page.getByRole('heading', { name: /Terms of Service/i })).toHaveCount(0);
  });

  test('supports mobile menu drawer navigation and tool links', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const menuToggle = page.locator('.header-menu-toggle');
    await expect(menuToggle).toBeVisible();
    await menuToggle.click();

    const drawer = page.locator('.mobile-nav-drawer');
    await expect(drawer).toHaveClass(/open/);

    // Open Charts from drawer
    await page.getByRole('button', { name: 'Protocol Charts Hub' }).click();
    await expect(drawer).not.toHaveClass(/open/);
    await expect(
      page.getByRole('heading', { name: 'NXDv3 Protocol — Economic Charts Hub' })
    ).toBeVisible();

    // Return to dashboard
    await page.getByRole('button', { name: 'Back to Dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'NXDv3 Protocol & Staking Hub' })).toBeVisible();
  });
});
