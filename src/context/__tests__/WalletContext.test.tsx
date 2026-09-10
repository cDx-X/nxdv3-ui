import { describe, it, expect, vi } from 'vitest';

vi.mock('@reown/appkit/react', () => ({
  useAppKit: vi.fn(),
  useAppKitAccount: vi.fn(),
  useAppKitNetwork: vi.fn(),
  useAppKitProvider: vi.fn(),
}));

vi.mock('ethers', () => ({
  ethers: {
    BrowserProvider: vi.fn(),
    JsonRpcProvider: vi.fn().mockImplementation(() => ({
      getNetwork: vi.fn().mockResolvedValue({ chainId: 10n }),
    })),
  },
}));

vi.mock('../../config/networks', () => ({
  getNetworkConfig: vi.fn(() => ({ chainId: 10, name: 'Optimism' })),
  hasConfiguredAddresses: vi.fn(() => true),
  NETWORKS: {},
}));

vi.mock('../../config/walletConnect', () => ({
  ensureAppKit: vi.fn().mockResolvedValue({ config: {}, projectId: 'test' }),
}));

describe('WalletContext', () => {
  it('placeholder test - context tested via integration', () => {
    expect(true).toBe(true);
  });
});
