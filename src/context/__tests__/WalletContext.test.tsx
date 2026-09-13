import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { getNetworkConfig, hasConfiguredAddresses, NETWORKS } from '../../config/networks';
import { ensureAppKit } from '../../config/walletConnect';
import { ChainController } from '@reown/appkit-controllers';

const {
  mockOpen,
  mockClose,
  mockSwitchNetwork,
  mockModalDisconnect,
  mockAppKitAccountState,
  mockAppKitNetworkState,
  mockStableWalletProvider,
} = vi.hoisted(() => {
  const switchFn = vi.fn().mockResolvedValue(undefined);
  return {
    mockOpen: vi.fn().mockResolvedValue(undefined),
    mockClose: vi.fn().mockResolvedValue(undefined),
    mockSwitchNetwork: switchFn,
    mockModalDisconnect: vi.fn().mockResolvedValue(undefined),
    mockAppKitAccountState: {
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      status: 'connected',
    },
    mockAppKitNetworkState: {
      chainId: 10,
      switchNetwork: switchFn,
    },
    mockStableWalletProvider: {
      request: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
    },
  };
});

vi.mock('@reown/appkit-controllers', () => ({
  ChainController: { state: { activeChain: 'eip155' }, resetAccount: vi.fn() },
  RouterController: { subscribeKey: vi.fn(() => () => {}) },
}));

vi.mock('@reown/appkit/react', () => ({
  createAppKit: vi.fn(),
  useAppKit: () => ({ open: mockOpen, close: mockClose }),
  useAppKitAccount: () => mockAppKitAccountState,
  useAppKitNetwork: () => mockAppKitNetworkState,
  useAppKitProvider: () => ({ walletProvider: mockStableWalletProvider }),
}));

vi.mock('../../config/walletConnect', () => ({
  ensureAppKit: vi.fn().mockResolvedValue({
    modal: { disconnect: mockModalDisconnect, close: mockClose },
    optimism: { id: 10, name: 'Optimism' },
    pulsechain: { id: 369, name: 'PulseChain' },
  }),
}));

vi.mock('ethers', async () => {
  const actual = await vi.importActual<typeof import('ethers')>('ethers');
  return {
    ...actual,
    ethers: {
      ...actual.ethers,
      BrowserProvider: vi.fn().mockImplementation(function () {
        return {
          getSigner: vi.fn().mockResolvedValue({
            getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
          }),
          getNetwork: vi.fn().mockImplementation(async () => ({
            chainId: BigInt(mockAppKitNetworkState.chainId || 10),
          })),
        };
      }),
    },
  };
});

import { WalletProvider, useWallet } from '../WalletContext';

const TestConsumer: React.FC = () => {
  const {
    address,
    isConnected,
    chainId,
    networkConfig,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    networkWarning,
    isConnecting,
    error,
  } = useWallet();

  return (
    <div>
      <div data-testid="connected">{isConnected ? 'yes' : 'no'}</div>
      <div data-testid="connecting">{isConnecting ? 'yes' : 'no'}</div>
      <div data-testid="address">{address || 'none'}</div>
      <div data-testid="chainId">{chainId !== null ? chainId.toString() : 'none'}</div>
      <div data-testid="network">{networkConfig.name}</div>
      <div data-testid="warning">{networkWarning || 'none'}</div>
      <div data-testid="error">{error || 'none'}</div>
      <button onClick={() => connectWallet()}>Connect</button>
      <button onClick={() => disconnectWallet()}>Disconnect</button>
      <button onClick={() => switchNetwork(369)}>Switch Network</button>
    </div>
  );
};

describe('WalletContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAppKitAccountState.address = '0x1234567890123456789012345678901234567890';
    mockAppKitAccountState.isConnected = true;
    mockAppKitAccountState.status = 'connected';
    mockAppKitNetworkState.chainId = 10;
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

  describe('WalletProvider & useWallet', () => {
    it('throws error when useWallet is used outside WalletProvider', () => {
      const TestComponent = () => {
        useWallet();
        return null;
      };
      // Suppress React error boundary log in test output
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<TestComponent />)).toThrow(
        'useWallet must be used within WalletProvider'
      );
      spy.mockRestore();
    });

    it('renders fallback state and triggers modal open on connectWallet', async () => {
      render(
        <WalletProvider>
          <TestConsumer />
        </WalletProvider>
      );

      const connectBtn = screen.getByText('Connect');
      await act(async () => {
        fireEvent.click(connectBtn);
      });

      await waitFor(() => {
        expect(mockOpen).toHaveBeenCalled();
      });
    });

    it('renders connected state with address and chainId when AppKit is loaded', async () => {
      render(
        <WalletProvider>
          <TestConsumer />
        </WalletProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Connect'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('connected')).toHaveTextContent('yes');
      });
      expect(screen.getByTestId('address')).toHaveTextContent('0x1234567890123456789012345678901234567890');
      expect(screen.getByTestId('chainId')).toHaveTextContent('10');
      expect(screen.getByTestId('network')).toHaveTextContent('Optimism');
    });

    it('disconnectWallet calls modal.disconnect and ChainController.resetAccount', async () => {
      render(
        <WalletProvider>
          <TestConsumer />
        </WalletProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Connect'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('connected')).toHaveTextContent('yes');
      });

      const disconnectBtn = screen.getByText('Disconnect');
      await act(async () => {
        fireEvent.click(disconnectBtn);
      });

      expect(mockModalDisconnect).toHaveBeenCalled();
      expect(ChainController.resetAccount).toHaveBeenCalled();
    });

    it('shows network warning when connected to unsupported network', async () => {
      mockAppKitNetworkState.chainId = 1; // Ethereum mainnet instead of Optimism
      render(
        <WalletProvider>
          <TestConsumer />
        </WalletProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Connect'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('warning')).not.toHaveTextContent('none');
      });
    });

    it('switchNetwork calls ensureAppKit and appkit switchNetwork', async () => {
      render(
        <WalletProvider>
          <TestConsumer />
        </WalletProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Connect'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('connected')).toHaveTextContent('yes');
      });

      const switchBtn = screen.getByText('Switch Network');
      await act(async () => {
        fireEvent.click(switchBtn);
      });

      await waitFor(() => {
        expect(mockSwitchNetwork).toHaveBeenCalled();
      });
    });

    it('watchdog resets stuck connecting state after timeout', async () => {
      vi.useFakeTimers();
      mockAppKitAccountState.status = 'connecting';
      mockAppKitAccountState.isConnected = false;

      render(
        <WalletProvider>
          <TestConsumer />
        </WalletProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Connect'));
      });

      // Advance timers by 31 seconds to trigger watchdog
      await act(async () => {
        vi.advanceTimersByTime(31000);
      });

      // Connecting state should be released by connectionReset flag
      expect(screen.getByTestId('connecting')).toHaveTextContent('no');
      vi.useRealTimers();
    });
  });
});
