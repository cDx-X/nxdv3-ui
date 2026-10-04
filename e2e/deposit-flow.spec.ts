import { expect, test } from '@playwright/test';
import { MOCK_WALLET_ADDRESS, installMockWallet } from './helpers/mockWallet';

/**
 * Wallet-driven deposit journey (Connect Wallet → Approve → Deposit & Mint).
 *
 * STATUS: scaffolded, not wired yet — the assertions below describe the target
 * behaviour, the missing piece is a deterministic RPC layer:
 *
 *   1. `installMockWallet` provides `window.ethereum` so AppKit can connect.
 *   2. The RPC layer has to be stubbed: `page.route` must answer the JSON-RPC POSTs
 *      that `src/utils/rpcProvider.ts` sends (eth_call with Multicall3 `aggregate3`
 *      payloads) with ABI-encoded fixtures, otherwise the read path hits the
 *      public Optimism RPC and the test becomes flaky/slow.
 *
 * The equivalent contract state machine already exists for the component level
 * in `src/integration/harness/chainSim.ts`; the same fixtures can be reused to
 * encode the RPC responses here.
 */

test.describe('deposit flow', () => {
  test.fixme('connects a wallet, approves DXNv2 and mints NXDv3', async ({ page }) => {
    await installMockWallet(page);
    await page.goto('/');

    // --- Connect -------------------------------------------------------------
    await page.getByRole('button', { name: 'Connect Wallet' }).click();
    await expect(page.getByText(MOCK_WALLET_ADDRESS, { exact: false })).toBeVisible();

    // --- Approve -------------------------------------------------------------
    await expect(page.getByRole('heading', { name: 'Mint NXDv3 (Deposit DXNv2)' })).toBeVisible();
    await page.locator('#depositAmount').fill('100');
    await page.getByRole('button', { name: 'Approve DXNv2 for Protocol' }).click();
    await expect(page.getByText('DXN has been approved!')).toBeVisible();

    // --- Deposit & mint ------------------------------------------------------
    await page.getByRole('button', { name: 'Deposit & Mint NXDv3' }).click();
    await expect(
      page.getByText('Deposit and minting of NXDv3 successfully completed!')
    ).toBeVisible();
  });

  test.fixme('rejects a wallet signature without moving any balance', async ({ page }) => {
    await installMockWallet(page);
    await page.goto('/');

    await page.getByRole('button', { name: 'Connect Wallet' }).click();
    await page.locator('#depositAmount').fill('100');
    await page.getByRole('button', { name: 'Approve DXNv2 for Protocol' }).click();

    // The mock wallet has to reject the next personal_sign / eth_sendTransaction.
    await expect(page.getByText('User rejected transaction')).toBeVisible();
  });
});
