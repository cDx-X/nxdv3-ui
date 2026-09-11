import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render with initial empty state', () => {
    renderWithProvider({ isConnected: false, address: null });
    expect(screen.getByTestId('global-loaded')).toHaveTextContent('false');
    expect(screen.getByTestId('user-loaded')).toHaveTextContent('false');
  });

  it('should fetch global data on mount', async () => {
    mockMulticall.mockResolvedValue(Array(15).fill({ success: true, result: 1000n }));
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('global-loaded')).toHaveTextContent('true');
    });
  });

  it('should handle fetch error gracefully', async () => {
    mockMulticall.mockRejectedValueOnce(new Error('RPC Error'));
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('global-loaded')).toHaveTextContent('false');
    });
  });

  it('should save and load from localStorage', async () => {
    mockMulticall.mockResolvedValueOnce(Array(15).fill({ success: true, result: 1000n }));
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('global-loaded')).toHaveTextContent('true');
    });

    const cached = localStorage.getItem('nxdv3_cached_global_state_v2');
    expect(cached).toBeTruthy();
  });
});
