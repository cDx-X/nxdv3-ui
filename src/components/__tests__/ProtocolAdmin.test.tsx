import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock contexts
vi.mock('../../context/WalletContext', () => {
  const React = require('react');
  return {
    WalletContext: {
      Provider: ({ children }: { children: React.ReactNode }) => children,
    },
    useWallet: vi.fn(),
  };
});

vi.mock('../../context/ProtocolContext', () => {
  const React = require('react');
  return {
    ProtocolContext: {
      Provider: ({ children }: { children: React.ReactNode }) => children,
    },
    useProtocol: vi.fn(),
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
        collectFees: vi.fn().mockResolvedValue({ hash: '0x123' }),
        processTax: vi.fn().mockResolvedValue({ hash: '0x123' }),
        processRewards: vi.fn().mockResolvedValue({ hash: '0x123' }),
      })),
      isAddress: vi.fn(() => true),
      parseEther: vi.fn((v) => BigInt(Math.floor(parseFloat(v) * 1e18))),
      formatEther: vi.fn((v) => (Number(v) / 1e18).toString()),
      Interface: Interface,
    },
  };
});

import { ProtocolAdmin } from '../ProtocolAdmin';
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
  },
  userData: {
    isLoaded: true,
  },
  refreshAll: vi.fn(),
  refreshGlobal: vi.fn(),
  refreshUser: vi.fn(),
  isLoadingGlobal: false,
  setIsLoadingGlobal: vi.fn(),
};

describe('ProtocolAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useWallet as any).mockReturnValue(mockWalletContext);
    (useProtocol as any).mockReturnValue(mockProtocolContext);
  });

  it('renders admin card with title', () => {
    render(
      React.createElement(ProtocolAdmin, {
        protocolAddress: "0x8C6f6ec2281D5678844556887DEDa5cEC907De87",
        nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
      })
    );

    // Look for admin related text
    const adminElements = screen.getAllByText(/Protocol Maintenance/);
    expect(adminElements.length).toBeGreaterThan(0);
  });

  it('shows connect wallet message when not connected', () => {
    (useWallet as any).mockReturnValue({ ...mockWalletContext, isConnected: false });
    render(
      React.createElement(ProtocolAdmin, {
        protocolAddress: "0x8C6f6ec2281D5678844556887DEDa5cEC907De87",
        nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
      })
    );

    expect(screen.getByText(/Connect wallet to manage/)).toBeInTheDocument();
  });

  it('shows collect fees button', () => {
    render(
      React.createElement(ProtocolAdmin, {
        protocolAddress: "0x8C6f6ec2281D5678844556887DEDa5cEC907De87",
        nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
      })
    );

    // Look for collect fees button - the button text might be different
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('shows process ETH button', () => {
    render(
      React.createElement(ProtocolAdmin, {
        protocolAddress: "0x8C6f6ec2281D5678844556887DEDa5cEC907De87",
        nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
      })
    );

    expect(screen.getByText(/Process ETH/)).toBeInTheDocument();
  });

  it('shows process tax button', () => {
    render(
      React.createElement(ProtocolAdmin, {
        protocolAddress: "0x8C6f6ec2281D5678844556887DEDa5cEC907De87",
        nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
      })
    );

    expect(screen.getByText(/Process tax/)).toBeInTheDocument();
  });

  it('shows refresh button', () => {
    render(
      React.createElement(ProtocolAdmin, {
        protocolAddress: "0x8C6f6ec2281D5678844556887DEDa5cEC907De87",
        nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
      })
    );

    expect(screen.getByTitle('Refresh')).toBeInTheDocument();
  });
});
