import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockCreateAppKit = vi.fn().mockReturnValue({ id: 'mock-appkit-modal' });

class MockEthersAdapter {
  name = 'ethers-adapter';
}

vi.mock('@reown/appkit/react', () => ({
  createAppKit: mockCreateAppKit,
}));

vi.mock('@reown/appkit-adapter-ethers', () => ({
  EthersAdapter: MockEthersAdapter,
}));

vi.mock('@reown/appkit/networks', () => ({
  optimism: { id: 10, name: 'Optimism' },
  pulsechain: { id: 369, name: 'PulseChain' },
}));

import { ensureAppKit, resetAppKitForTesting } from '../walletConnect';

describe('walletConnect config', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    vi.clearAllMocks();
    resetAppKitForTesting();
  });

  afterEach(() => {
    import.meta.env.VITE_WALLETCONNECT_PROJECT_ID = originalEnv.VITE_WALLETCONNECT_PROJECT_ID;
    resetAppKitForTesting();
  });

  it('throws an error if VITE_WALLETCONNECT_PROJECT_ID is not configured', async () => {
    import.meta.env.VITE_WALLETCONNECT_PROJECT_ID = '';

    await expect(ensureAppKit()).rejects.toThrow(
      /VITE_WALLETCONNECT_PROJECT_ID is not configured/i
    );
  });

  it('throws an error if VITE_WALLETCONNECT_PROJECT_ID is the default placeholder', async () => {
    import.meta.env.VITE_WALLETCONNECT_PROJECT_ID = 'your_walletconnect_project_id_here';

    await expect(ensureAppKit()).rejects.toThrow(
      /VITE_WALLETCONNECT_PROJECT_ID is not configured/i
    );
  });

  it('initializes createAppKit with correct options and memoizes promise', async () => {
    import.meta.env.VITE_WALLETCONNECT_PROJECT_ID = 'test-project-id-123';

    const result1 = await ensureAppKit();
    expect(mockCreateAppKit).toHaveBeenCalledTimes(1);
    expect(mockCreateAppKit).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'test-project-id-123',
        enableReconnect: true,
        networks: [
          { id: 10, name: 'Optimism' },
          { id: 369, name: 'PulseChain' },
        ],
        metadata: expect.objectContaining({
          name: 'NXD v3 Protocol & Staking Vault',
          url: window.location.origin,
        }),
      })
    );

    expect(result1.modal).toEqual({ id: 'mock-appkit-modal' });

    // Calling again should return the memoized singleton promise without calling createAppKit again
    const result2 = await ensureAppKit();
    expect(result2).toBe(result1);
    expect(mockCreateAppKit).toHaveBeenCalledTimes(1);
  });
});
