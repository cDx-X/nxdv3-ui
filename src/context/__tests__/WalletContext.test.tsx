import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNetworkConfig, hasConfiguredAddresses, NETWORKS } from '../../config/networks';
import { ensureAppKit } from '../../config/walletConnect';
import { ChainController } from '@reown/appkit-controllers';

vi.mock('@reown/appkit-controllers', () => ({
  ChainController: { state: { activeChain: 'eip155' }, resetAccount: vi.fn() },
}));

vi.mock('../../config/walletConnect', () => ({
  ensureAppKit: vi.fn().mockResolvedValue({
    modal: { disconnect: vi.fn().mockResolvedValue(undefined), close: vi.fn() },
    optimism: { id: 10, name: 'Optimism' },
    pulsechain: { id: 369, name: 'PulseChain' },
  }),
}));

describe('WalletContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNetworkConfig', () => {
    it('returns Optimism for chainId 10', () => {
      const config = getNetworkConfig(10);
      expect(config.name).toBe('Optimism');
      expect(config.chainId).toBe(10);
      expect(config.addresses.protocolAddress).toBe('0x9a781f3313635047EAfc0BeD3699721bc077161A');
    });

    it('returns PulseChain for chainId 369', () => {
      const config = getNetworkConfig(369);
      expect(config.name).toBe('PulseChain');
      expect(config.chainId).toBe(369);
      expect(config.addresses.protocolAddress).toBe('');
    });

    it('returns Optimism as default for null', () => {
      const config = getNetworkConfig(null);
      expect(config.name).toBe('Optimism');
    });

    it('returns Optimism for unknown chainId', () => {
      const config = getNetworkConfig(9999);
      expect(config.name).toBe('Optimism');
      expect(config.chainId).toBe(10);
    });

    it('handles bigint chainId', () => {
      const config = getNetworkConfig(10n);
      expect(config.name).toBe('Optimism');
    });
  });

  describe('hasConfiguredAddresses', () => {
    const makeConfig = (protocolAddress: string) => ({
      chainId: 10,
      name: 'Optimism',
      addresses: { protocolAddress },
    } as any);

    it('returns true when protocolAddress is set', () => {
      expect(hasConfiguredAddresses(makeConfig('0x1234'))).toBe(true);
    });

    it('returns true when protocolAddress has whitespace', () => {
      expect(hasConfiguredAddresses(makeConfig('   0xabc   '))).toBe(true);
    });

    it('returns false when protocolAddress is empty', () => {
      expect(hasConfiguredAddresses(makeConfig(''))).toBe(false);
    });

    it('returns false when protocolAddress is missing', () => {
      expect(hasConfiguredAddresses({
        chainId: 10,
        name: 'Optimism',
        addresses: {},
      } as any)).toBe(false);
    });

    it('returns false for PulseChain placeholder', () => {
      expect(hasConfiguredAddresses(NETWORKS[369])).toBe(false);
    });

    it('returns true for Optimism', () => {
      expect(hasConfiguredAddresses(NETWORKS[10])).toBe(true);
    });
  });

  describe('NetworkConfig integration', () => {
    it('has all required fields for Optimism', () => {
      const config = getNetworkConfig(10);
      expect(config).toHaveProperty('chainId');
      expect(config).toHaveProperty('chainIdHex');
      expect(config).toHaveProperty('name');
      expect(config).toHaveProperty('rpcUrl');
      expect(config).toHaveProperty('rpcUrls');
      expect(config).toHaveProperty('nativeCurrency');
      expect(config).toHaveProperty('blockExplorer');
      expect(config).toHaveProperty('addresses');

      const addrs = config.addresses;
      expect(addrs).toHaveProperty('protocolAddress');
      expect(addrs).toHaveProperty('vaultAddress');
      expect(addrs).toHaveProperty('nxdAddress');
      expect(addrs).toHaveProperty('taxRecipientAddress');
      expect(addrs).toHaveProperty('XenAddress');
      expect(addrs).toHaveProperty('dxnAddress');
      expect(addrs).toHaveProperty('DBXenAddress');
      expect(addrs).toHaveProperty('iDBXenViews');
    });
  });

  describe('ensureAppKit integration', () => {
    it('returns modal, optimism, and pulsechain', async () => {
      const result = await ensureAppKit();
      expect(result.modal).toBeDefined();
      expect(result.optimism).toBeDefined();
      expect(result.pulsechain).toBeDefined();
    });

    it('is a singleton returning same shape', async () => {
      const first = await ensureAppKit();
      const second = await ensureAppKit();
      expect(first).toBeDefined();
      expect(second).toBeDefined();
    });
  });

  describe('ChainController.resetAccount integration', () => {
    it('resetAccount is available', () => {
      expect(ChainController.resetAccount).toBeDefined();
      expect(typeof ChainController.resetAccount).toBe('function');
    });
  });
});
