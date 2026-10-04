import { Page } from '@playwright/test';

/**
 * Minimal EIP-1193 wallet used by the (still planned) wallet-driven E2E flows.
 *
 * `page.addInitScript` runs before any application script, so `window.ethereum`
 * exists by the time `WalletContext` creates the Reown AppKit instance.
 */

export interface MockWalletOptions {
  address?: string;
  /** Hex chain id, defaults to Optimism (0xa = 10). */
  chainId?: string;
}

export const MOCK_WALLET_ADDRESS = '0x1111111111111111111111111111111111111111';
export const OPTIMISM_CHAIN_ID = '0xa';

export const installMockWallet = async (
  page: Page,
  options: MockWalletOptions = {}
): Promise<void> => {
  const address = options.address ?? MOCK_WALLET_ADDRESS;
  const chainId = options.chainId ?? OPTIMISM_CHAIN_ID;

  await page.addInitScript(
    ({ injectedAddress, injectedChainId }) => {
      const provider = {
        isMetaMask: true,
        chainId: injectedChainId,
        selectedAddress: injectedAddress,
        async request({ method }: { method: string }): Promise<unknown> {
          switch (method) {
            case 'eth_chainId':
              return injectedChainId;
            case 'net_version':
              return String(Number.parseInt(injectedChainId, 16));
            case 'eth_accounts':
            case 'eth_requestAccounts':
              return [injectedAddress];
            case 'wallet_switchEthereumChain':
            case 'wallet_revokePermissions':
              return null;
            case 'eth_blockNumber':
              return '0x1';
            case 'eth_getBalance':
            case 'eth_call':
              return '0x0';
            case 'eth_estimateGas':
              return '0x5208';
            case 'eth_sendTransaction':
              return `0x${'1'.repeat(64)}`;
            case 'eth_getTransactionReceipt':
              return {
                transactionHash: `0x${'1'.repeat(64)}`,
                status: '0x1',
                blockNumber: '0x1',
              };
            default:
              throw Object.assign(new Error(`mock wallet: unsupported ${method}`), {
                code: 4200,
              });
          }
        },
        on: () => undefined,
        removeListener: () => undefined,
        enable: async () => [injectedAddress],
      };

      Object.defineProperty(window, 'ethereum', { value: provider, configurable: true });
    },
    { injectedAddress: address, injectedChainId: chainId }
  );
};
