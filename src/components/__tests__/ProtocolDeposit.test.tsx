import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock contexts
vi.mock('../../context/WalletContext', () => ({
  WalletContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
  useWallet: vi.fn(),
}));

vi.mock('../../context/ProtocolContext', () => ({
  ProtocolContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
  useProtocol: vi.fn(),
}));

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
        approve: vi.fn().mockResolvedValue({ hash: '0x123' }),
      })),
      isAddress: vi.fn(() => true),
      parseEther: vi.fn((v) => BigInt(v) * 10n ** 18n),
      formatEther: vi.fn((v) => (Number(v) / 1e18).toString()),
      Interface: Interface,
    },
  };
});

import { ProtocolDeposit } from '../ProtocolDeposit';
import { useWallet } from '../../context/WalletContext';
import { useProtocol } from '../../context/ProtocolContext';

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
    currentRate: 1000000000000000000n,
    nxdMintedViaDeposit: 0n,
    maxMintableDeposit: 1000000000000000000000000n,
    maxRewardsSupply: 1000000000000000000000000n,
    tierSize: 1000000000000000000000n,
  },
  userData: {
    isLoaded: true,
    dxnBalance: 500000000000000000000n,
    dxnAllowance: 0n,
  },
  refreshAll: vi.fn(),
  refreshGlobal: vi.fn(),
  refreshUser: vi.fn(),
  isLoadingGlobal: false,
  setIsLoadingGlobal: vi.fn(),
};

describe('ProtocolDeposit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useWallet as any).mockReturnValue(mockWalletContext);
    (useProtocol as any).mockReturnValue(mockProtocolContext);
  });

  it('renders deposit card with title', () => {
    render(
      React.createElement(ProtocolDeposit, {
        protocolAddress: "0x8C6f6ec2281D5678844556887DEDa5cEC907De87",
        dxnAddress: "0x90386DA49028ef1eF18F47f0a740cAAB50782576"
      })
    );

    // Look for protocol deposit related text
    const protocolElements = screen.getAllByText(/Deposit DXN/);
    expect(protocolElements.length).toBeGreaterThan(0);
  });

  it('shows connect wallet message when not connected', () => {
    (useWallet as any).mockReturnValue({ ...mockWalletContext, isConnected: false });
    render(
      React.createElement(ProtocolDeposit, {
        protocolAddress: "0x8C6f6ec2281D5678844556887DEDa5cEC907De87",
        dxnAddress: "0x90386DA49028ef1eF18F47f0a740cAAB50782576"
      })
    );

    expect(screen.getByText(/Connect your wallet/)).toBeInTheDocument();
  });

  it('shows deposit input field', () => {
    render(
      React.createElement(ProtocolDeposit, {
        protocolAddress: "0x8C6f6ec2281D5678844556887DEDa5cEC907De87",
        dxnAddress: "0x90386DA49028ef1eF18F47f0a740cAAB50782576"
      })
    );

    expect(screen.getByPlaceholderText(/0.0 NXDv3/)).toBeInTheDocument();
  });

  it('shows deposit button', () => {
    render(
      React.createElement(ProtocolDeposit, {
        protocolAddress: "0x8C6f6ec2281D5678844556887DEDa5cEC907De87",
        dxnAddress: "0x90386DA49028ef1eF18F47f0a740cAAB50782576"
      })
    );

    // Look for deposit button
    const depositElements = screen.getAllByText(/Deposit/);
    expect(depositElements.length).toBeGreaterThan(0);
  });

  it('shows DXN balance', () => {
    render(
      React.createElement(ProtocolDeposit, {
        protocolAddress: "0x8C6f6ec2281D5678844556887DEDa5cEC907De87",
        dxnAddress: "0x90386DA49028ef1eF18F47f0a740cAAB50782576"
      })
    );

    // Look for DXN balance related text
    const dxnElements = screen.getAllByText(/DXNv2/);
    expect(dxnElements.length).toBeGreaterThan(0);
  });
});
