import { describe, it, expect } from 'vitest';
import { NETWORKS, getNetworkConfig, hasConfiguredAddresses } from '../networks';

describe('networks', () => {
  describe('NETWORKS', () => {
    it('contains Optimism network (chainId 10)', () => {
      expect(NETWORKS[10]).toBeDefined();
      expect(NETWORKS[10].name).toBe('Optimism');
      expect(NETWORKS[10].chainId).toBe(10);
      expect(NETWORKS[10].chainIdHex).toBe('0xa');
    });

    it('contains PulseChain network (chainId 369)', () => {
      expect(NETWORKS[369]).toBeDefined();
      expect(NETWORKS[369].name).toBe('PulseChain');
      expect(NETWORKS[369].chainId).toBe(369);
      expect(NETWORKS[369].chainIdHex).toBe('0x171');
    });

    it('Optimism has correct native currency', () => {
      expect(NETWORKS[10].nativeCurrency.name).toBe('Ether');
      expect(NETWORKS[10].nativeCurrency.symbol).toBe('ETH');
      expect(NETWORKS[10].nativeCurrency.decimals).toBe(18);
    });

    it('PulseChain has correct native currency', () => {
      expect(NETWORKS[369].nativeCurrency.name).toBe('Pulse');
      expect(NETWORKS[369].nativeCurrency.symbol).toBe('PLS');
      expect(NETWORKS[369].nativeCurrency.decimals).toBe(18);
    });

    it('Optimism has block explorer URL', () => {
      expect(NETWORKS[10].blockExplorer).toBe('https://optimistic.etherscan.io');
    });

    it('PulseChain has block explorer URL', () => {
      expect(NETWORKS[369].blockExplorer).toBe('https://scan.pulsechain.com');
    });

    it('Optimism has all contract addresses configured', () => {
      const addrs = NETWORKS[10].addresses;
      expect(addrs.protocolAddress).toBe('0x53C58e813e318b6b28F5277379FAC9223bA1ddB7');
      expect(addrs.vaultAddress).toBe('0xc96957F49A946b0207d3F15eBe6db4456433eEF9');
      expect(addrs.nxdAddress).toBe('0x493dB003Dc5d77F635407D9a149E380B72670913');
      expect(addrs.taxRecipientAddress).toBe('0xB0447F051b80F77Ce273a1bd349cFc38b656b39e');
      expect(addrs.XenAddress).toBe('0xeB585163DEbB1E637c6D617de3bEF99347cd75c8');
      expect(addrs.dxnAddress).toBe('0x90386DA49028ef1eF18F47f0a740cAAB50782576');
      expect(addrs.DBXenAddress).toBe('0x95202A555171458dA4a48be3b4C290eF832e38b2');
      expect(addrs.iDBXenViews).toBe('0x928766B9437fFDD515fe7AcCC7ce74e7A78C0411');
    });

    it('PulseChain has placeholder addresses for some contracts', () => {
      const addrs = NETWORKS[369].addresses;
      expect(addrs.protocolAddress).toBe('');
      expect(addrs.vaultAddress).toBe('');
      expect(addrs.nxdAddress).toBe('');
      expect(addrs.taxRecipientAddress).toBe('');
      // These should be configured on PulseChain
      expect(addrs.XenAddress).toBe('0x8a7FDcA264e87b6da72D000f22186B4403081A2a');
      expect(addrs.dxnAddress).toBe('0xfe7714618a8cceD29788aa6D490BBF7c5522aA77');
      expect(addrs.DBXenAddress).toBe('0x6054A1dBC14bd1b1653727f3E4690DB4174d8F0c');
      expect(addrs.iDBXenViews).toBe('');
    });
  });

  describe('getNetworkConfig', () => {
    it('returns Optimism config for chainId 10', () => {
      const config = getNetworkConfig(10);
      expect(config.name).toBe('Optimism');
      expect(config.chainId).toBe(10);
    });

    it('returns PulseChain config for chainId 369', () => {
      const config = getNetworkConfig(369);
      expect(config.name).toBe('PulseChain');
      expect(config.chainId).toBe(369);
    });

    it('returns Optimism as default for null chainId', () => {
      const config = getNetworkConfig(null);
      expect(config.name).toBe('Optimism');
      expect(config.chainId).toBe(10);
    });

    it('returns Optimism as default for unknown chainId', () => {
      const config = getNetworkConfig(9999);
      expect(config.name).toBe('Optimism');
      expect(config.chainId).toBe(10);
    });

    it('handles bigint chainId', () => {
      const config = getNetworkConfig(10n);
      expect(config.name).toBe('Optimism');
    });

    it('handles string-like number chainId', () => {
      const config = getNetworkConfig(369);
      expect(config.name).toBe('PulseChain');
    });
  });

  describe('hasConfiguredAddresses', () => {
    it('returns true when protocolAddress is set', () => {
      const config = {
        chainId: 10,
        name: 'Optimism',
        addresses: { protocolAddress: '0x1234' },
      } as any;
      expect(hasConfiguredAddresses(config)).toBe(true);
    });

    it('returns true when protocolAddress is non-empty string', () => {
      const config = {
        chainId: 10,
        name: 'Optimism',
        addresses: { protocolAddress: '   0xabc   ' },
      } as any;
      expect(hasConfiguredAddresses(config)).toBe(true);
    });

    it('returns false when protocolAddress is empty string', () => {
      const config = {
        chainId: 10,
        name: 'Optimism',
        addresses: { protocolAddress: '' },
      } as any;
      expect(hasConfiguredAddresses(config)).toBe(false);
    });

    it('returns false when protocolAddress is missing', () => {
      const config = {
        chainId: 10,
        name: 'Optimism',
        addresses: {},
      } as any;
      expect(hasConfiguredAddresses(config)).toBe(false);
    });

    it('returns false for PulseChain placeholder config', () => {
      expect(hasConfiguredAddresses(NETWORKS[369])).toBe(false);
    });

    it('returns true for Optimism config', () => {
      expect(hasConfiguredAddresses(NETWORKS[10])).toBe(true);
    });
  });
});
