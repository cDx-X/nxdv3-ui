import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock data
const mockWalletContext = {
  isConnected: true,
  address: '0x1234567890123456789012345678901234567890',
  signer: {},
  networkConfig: {
    chainId: 10,
    name: 'Optimism',
    addresses: {
      protocolAddress: '0x8C6f6ec2281D5678844556887DEDa5cEC907De87',
      vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
      nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
      dxnAddress: '0x90386DA49028ef1eF18F47f0a740cAAB50782576',
      taxRecipientAddress: '0x8ae6A0Ab65cE133365760F11367d5353BBcf5f40',
      XenAddress: '0xeB585163DEbB1E637c6D617de3bEF99347cd75c8',
    },
  },
  networkWarning: null,
  switchNetwork: vi.fn(),
  connectWallet: vi.fn(),
  disconnectWallet: vi.fn(),
  error: null,
  initError: null,
};

const mockProtocolContext = {
  globalData: {
    isLoaded: true,
    totalVaultStaked: 1000n * 10n ** 18n,
  },
  userData: {
    isLoaded: true,
    nxdBalance: 500n * 10n ** 18n,
    nxdAllowance: 0n,
    stakedBalance: 100n * 10n ** 18n,
    pendingETH: 10n * 10n ** 18n,
    pendingXEN: 1000n,
    cooldownRequest: null,
  },
  refreshAll: vi.fn(),
  refreshGlobal: vi.fn(),
  refreshUser: vi.fn(),
  isLoadingGlobal: false,
  setIsLoadingGlobal: vi.fn(),
};

// Mock contexts before importing components
vi.mock('../../context/WalletContext', () => {
  const React = require('react');
  return {
    WalletContext: {
      Provider: ({ children }: { children: React.ReactNode }) => children,
      Consumer: ({ children }: { children: any }) => children({}),
    },
    useWallet: vi.fn(() => mockWalletContext),
  };
});

vi.mock('../../context/ProtocolContext', () => {
  const React = require('react');
  return {
    ProtocolContext: {
      Provider: ({ children }: { children: React.ReactNode }) => children,
      Consumer: ({ children }: { children: any }) => children({}),
    },
    useProtocol: vi.fn(() => mockProtocolContext),
  };
});

// Mock ethers
vi.mock('ethers', () => {
  const Interface = vi.fn().mockImplementation(() => ({
    encodeFunctionData: vi.fn().mockReturnValue('0x'),
    decodeFunctionResult: vi.fn().mockReturnValue([100n]),
  }));
  
  return {
    ethers: {
      Contract: vi.fn().mockImplementation(() => ({
        deposit: vi.fn().mockResolvedValue({ hash: '0x123' }),
        withdraw: vi.fn().mockResolvedValue({ hash: '0x123' }),
        approve: vi.fn().mockResolvedValue({ hash: '0x123' }),
      })),
      BrowserProvider: vi.fn(),
      isAddress: vi.fn(() => true),
      parseEther: vi.fn((v) => BigInt(v) * 10n ** 18n),
      formatEther: vi.fn((v) => Number(v / 10n ** 18n).toString()),
      Interface: Interface,
    },
  };
});

import { VaultStaking } from '../VaultStaking';
import { useWallet } from '../../context/WalletContext';
import { useProtocol } from '../../context/ProtocolContext';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui);
};

describe('VaultStaking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useWallet as any).mockReturnValue(mockWalletContext);
    (useProtocol as any).mockReturnValue(mockProtocolContext);
  });

  it('renders staking card with title', () => {
    renderWithProviders(
      React.createElement(VaultStaking, {
        vaultAddress: "0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1",
        nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
      })
    );

    expect(screen.getByText(/Staking & Rewards/)).toBeInTheDocument();
  });

  it('shows connect wallet message when not connected', () => {
    (useWallet as any).mockReturnValue({ ...mockWalletContext, isConnected: false });
    renderWithProviders(
      React.createElement(VaultStaking, {
        vaultAddress: "0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1",
        nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
      })
    );

    expect(screen.getByText(/Connect your wallet/)).toBeInTheDocument();
  });

  it('shows disabled stake button when allowance is 0', () => {
    renderWithProviders(
      React.createElement(VaultStaking, {
        vaultAddress: "0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1",
        nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
      })
    );

    const stakeButton = screen.getByText('Stake NXDv3');
    expect(stakeButton).toBeDisabled();
  });

  it('shows stake button when allowance is granted', () => {
    (useProtocol as any).mockReturnValue({
      ...mockProtocolContext,
      userData: { ...mockProtocolContext.userData, nxdAllowance: 1000n * 10n ** 18n },
    });
    renderWithProviders(
      React.createElement(VaultStaking, {
        vaultAddress: "0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1",
        nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
      })
    );

    const stakeButton = screen.getByText('Stake NXDv3');
    expect(stakeButton).toBeInTheDocument();
  });

  it('shows claim rewards button', () => {
    renderWithProviders(
      React.createElement(VaultStaking, {
        vaultAddress: "0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1",
        nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
      })
    );

    expect(screen.getByText('Claim Rewards')).toBeInTheDocument();
  });
});
