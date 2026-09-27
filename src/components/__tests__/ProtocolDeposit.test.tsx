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
  it('renders multi-tier breakdown correctly when amount spans multiple tiers', () => {
    // Current minted = 800 (Tier 1 is 1000). User wants to mint 500 NXD.
    // Tier 1 gets 200 NXD, Tier 2 gets 300 NXD.
    (useProtocol as any).mockReturnValue({
      ...mockProtocolContext,
      globalData: {
        ...mockProtocolContext.globalData,
        currentRate: 1000000000000000000n,
        nxdMintedViaDeposit: 800000000000000000000n,
        maxMintableDeposit: 3000000000000000000000n,
        tierSize: 1000000000000000000000n,
      },
      userData: {
        ...mockProtocolContext.userData,
        dxnAllowance: 10000000000000000000000n,
      },
    });

    render(
      React.createElement(ProtocolDeposit, {
        protocolAddress: "0x8C6f6ec2281D5678844556887DEDa5cEC907De87",
        dxnAddress: "0x90386DA49028ef1eF18F47f0a740cAAB50782576",
      })
    );

    const input = screen.getByPlaceholderText(/0.0 NXDv3/);
    input.focus();
    // Simulate typing 500 NXD
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )!.set!;
    nativeInputValueSetter.call(input, '500');
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(screen.getByText(/Estimated tokens to mint:/i)).toBeInTheDocument();
    expect(screen.getByText(/Tier 1/i)).toBeInTheDocument();
  });

  it('automatically sets depositMode to nomint when minting is finished', () => {
    // Minted equals max mintable deposit
    (useProtocol as any).mockReturnValue({
      ...mockProtocolContext,
      globalData: {
        ...mockProtocolContext.globalData,
        nxdMintedViaDeposit: 3000000000000000000000n,
        maxMintableDeposit: 3000000000000000000000n,
        tierSize: 1000000000000000000000n,
      },
    });

    render(
      React.createElement(ProtocolDeposit, {
        protocolAddress: "0x8C6f6ec2281D5678844556887DEDa5cEC907De87",
        dxnAddress: "0x90386DA49028ef1eF18F47f0a740cAAB50782576",
      })
    );

    const depositMintBtn = screen.getByRole('button', { name: /^Deposit & Mint$/i });
    expect(depositMintBtn).toBeDisabled();
    expect(screen.getByPlaceholderText(/0.0 DXNv2/)).toBeInTheDocument();
  });
});
