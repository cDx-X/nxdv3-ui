import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';

vi.mock('../../utils/multicall', () => ({
  multicall: vi.fn(),
  MulticallCall: vi.fn(),
}));

vi.mock('../WalletContext', () => ({
  useWallet: vi.fn(),
  WalletContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

vi.mock('ethers', () => ({
  ethers: {
    isAddress: vi.fn(() => true),
    Interface: vi.fn().mockImplementation(() => ({
      encodeFunctionData: vi.fn().mockReturnValue('0x'),
      decodeFunctionResult: vi.fn().mockReturnValue([100n]),
    })),
  },
}));

import { ProtocolProvider, useProtocol } from '../ProtocolContext';
import { useWallet } from '../WalletContext';
import { multicall } from '../../utils/multicall';

const mockUseWallet = useWallet as unknown as ReturnType<typeof vi.fn>;
const mockMulticall = multicall as unknown as ReturnType<typeof vi.fn>;

const TestComponent: React.FC = () => {
  const { globalData, userData, refreshAll, isLoadingGlobal } = useProtocol();

  return (
    <div>
      <div data-testid="global-loaded">{globalData.isLoaded ? 'true' : 'false'}</div>
      <div data-testid="global-minted">{globalData.totalMinted.toString()}</div>
      <div data-testid="user-loaded">{userData.isLoaded ? 'true' : 'false'}</div>
      <div data-testid="user-dxn">{userData.dxnBalance.toString()}</div>
      <div data-testid="user-nxd">{userData.nxdBalance.toString()}</div>
      <div data-testid="user-staked">{userData.stakedBalance.toString()}</div>
      <div data-testid="user-cooldown-amount">
        {userData.cooldownRequest ? userData.cooldownRequest.amount.toString() : 'none'}
      </div>
      <div data-testid="user-cooldown-release">
        {userData.cooldownRequest ? userData.cooldownRequest.releaseTime.toString() : 'none'}
      </div>
      <div data-testid="loading">{isLoadingGlobal ? 'true' : 'false'}</div>
      <button onClick={() => refreshAll(true)}>Refresh</button>
    </div>
  );
};

const renderWithProvider = (ctx: Record<string, unknown> = {}) => {
  mockUseWallet.mockReturnValue({
    isConnected: true,
    address: '0x1234567890123456789012345678901234567890',
    signer: {},
    networkConfig: { chainId: 10, name: 'Optimism', addresses: {} },
    ...ctx,
  });

  return render(
    <ProtocolProvider>
      <TestComponent />
    </ProtocolProvider>
  );
};

describe('ProtocolContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockMulticall.mockResolvedValue(Array(20).fill({ success: true, result: 1000n }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render with initial empty state', () => {
    mockMulticall.mockImplementation(() => new Promise(() => {}));
    renderWithProvider({ isConnected: false, address: null });
    expect(screen.getByTestId('global-loaded')).toHaveTextContent('false');
    expect(screen.getByTestId('user-loaded')).toHaveTextContent('false');
  });

  it('should fetch global data on mount', async () => {
    mockMulticall.mockResolvedValue(Array(20).fill({ success: true, result: 1000n }));
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('global-loaded')).toHaveTextContent('true');
    });
    expect(screen.getByTestId('global-minted')).toBeInTheDocument();
  });

  it('should handle fetch error gracefully', async () => {
    mockMulticall.mockRejectedValueOnce(new Error('RPC Error'));
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('global-loaded')).toHaveTextContent('false');
    });
  });

  it('should save and load from localStorage', async () => {
    mockMulticall.mockResolvedValue(Array(20).fill({ success: true, result: 1000n }));
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('global-loaded')).toHaveTextContent('true');
    });

    const cached = localStorage.getItem('nxdv3_cached_global_state_v2');
    expect(cached).toBeTruthy();
  });

  it('should fetch user data when connected and address is present', async () => {
    mockMulticall.mockResolvedValue(Array(20).fill({ success: true, result: 5000n }));
    renderWithProvider({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      networkConfig: {
        chainId: 10,
        name: 'Optimism',
        addresses: {
          protocolAddress: '0x1111',
          vaultAddress: '0x2222',
          nxdAddress: '0x3333',
          dxnAddress: '0x4444',
          taxRecipientAddress: '0x5555',
          XenAddress: '0x6666',
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-loaded')).toHaveTextContent('true');
    });
    expect(screen.getByTestId('user-dxn')).toHaveTextContent('5000');
  });

  it('should trigger refreshAll when requested', async () => {
    mockMulticall.mockResolvedValue(Array(20).fill({ success: true, result: 1000n }));
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('global-loaded')).toHaveTextContent('true');
    });

    const initialCallCount = mockMulticall.mock.calls.length;
    const refreshButton = screen.getByText('Refresh');
    act(() => {
      refreshButton.click();
    });

    await waitFor(() => {
      expect(mockMulticall.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it('should reset user state when address becomes null (disconnected)', async () => {
    const { rerender } = renderWithProvider({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-loaded')).toHaveTextContent('true');
    });

    mockUseWallet.mockReturnValue({
      isConnected: false,
      address: null,
      signer: null,
      networkConfig: { chainId: 10, name: 'Optimism', addresses: {} },
    });

    rerender(
      <ProtocolProvider>
        <TestComponent />
      </ProtocolProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-loaded')).toHaveTextContent('false');
      expect(screen.getByTestId('user-dxn')).toHaveTextContent('0');
    });
  });

  it('should trigger debounced user refresh on window focus', async () => {
    vi.useFakeTimers();
    renderWithProvider();

    const initialCallCount = mockMulticall.mock.calls.length;
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(mockMulticall.mock.calls.length).toBeGreaterThanOrEqual(initialCallCount);
  });
  it('should fallback to initial global state when localStorage contains invalid JSON', () => {
    localStorage.setItem('nxdv3_cached_global_state_v2', 'invalid-json{');
    mockMulticall.mockImplementation(() => new Promise(() => {}));

    renderWithProvider({ isConnected: false, address: null });

    expect(screen.getByTestId('global-loaded')).toHaveTextContent('false');
    expect(screen.getByTestId('global-minted')).toHaveTextContent('0');
  });

  it('should initialize with cached state from valid localStorage data before network fetch', () => {
    localStorage.setItem(
      'nxdv3_cached_global_state_v2',
      JSON.stringify({
        totalMinted: '999999',
        effectiveSupply: '500000',
        burnedPercentage: 25,
      })
    );
    mockMulticall.mockImplementation(() => new Promise(() => {})); // pending

    renderWithProvider({ isConnected: false, address: null });

    expect(screen.getByTestId('global-loaded')).toHaveTextContent('true');
    expect(screen.getByTestId('global-minted')).toHaveTextContent('999999');
  });

  it('should initialize with cached user state including cooldownRequest from localStorage', () => {
    const testAddr = '0x1234567890123456789012345678901234567890';
    localStorage.setItem(
      `nxdv3_cached_user_state_v2_${testAddr.toLowerCase()}`,
      JSON.stringify({
        dxnBalance: '150',
        nxdBalance: '250',
        stakedBalance: '350',
        pendingETH: '10',
        pendingXEN: '20',
        cooldownRequest: {
          amount: '75',
          releaseTime: 1700000000,
        },
      })
    );
    mockMulticall.mockImplementation(() => new Promise(() => {})); // pending

    renderWithProvider({ isConnected: true, address: testAddr });

    expect(screen.getByTestId('user-loaded')).toHaveTextContent('true');
    expect(screen.getByTestId('user-dxn')).toHaveTextContent('150');
    expect(screen.getByTestId('user-nxd')).toHaveTextContent('250');
    expect(screen.getByTestId('user-staked')).toHaveTextContent('350');
    expect(screen.getByTestId('user-cooldown-amount')).toHaveTextContent('75');
    expect(screen.getByTestId('user-cooldown-release')).toHaveTextContent('1700000000');
  });

  it('should fallback to initial user state when user localStorage contains invalid JSON', () => {
    const testAddr = '0x1234567890123456789012345678901234567890';
    localStorage.setItem(`nxdv3_cached_user_state_v2_${testAddr.toLowerCase()}`, 'invalid-json{');
    mockMulticall.mockImplementation(() => new Promise(() => {})); // pending

    renderWithProvider({ isConnected: true, address: testAddr });

    expect(screen.getByTestId('user-loaded')).toHaveTextContent('false');
    expect(screen.getByTestId('user-dxn')).toHaveTextContent('0');
    expect(screen.getByTestId('user-cooldown-amount')).toHaveTextContent('none');
  });
});
