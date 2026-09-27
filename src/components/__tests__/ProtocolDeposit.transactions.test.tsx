import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

vi.mock('../../context/WalletContext', () => ({
  WalletContext: { Provider: ({ children }: { children: React.ReactNode }) => children },
  useWallet: vi.fn(),
}));

vi.mock('../../context/ProtocolContext', () => ({
  ProtocolContext: { Provider: ({ children }: { children: React.ReactNode }) => children },
  useProtocol: vi.fn(),
}));

const mockDeposit = vi.fn().mockResolvedValue({ hash: '0xdeposit123' });
const mockDepositNoMint = vi.fn().mockResolvedValue({ hash: '0xdepositnomint123' });
const mockApprove = vi.fn().mockResolvedValue({ hash: '0xapprove123' });
const mockWait = vi.fn().mockResolvedValue({ status: 1 });

vi.mock('ethers', () => {
  const Interface = vi.fn().mockImplementation(function () {
    return {
      encodeFunctionData: vi.fn().mockReturnValue('0x'),
      decodeFunctionResult: vi.fn().mockReturnValue([100n]),
    };
  });

  return {
    ethers: {
      Contract: vi.fn().mockImplementation(function () {
        return {
          deposit: mockDeposit,
          depositNoMint: mockDepositNoMint,
          approve: mockApprove,
        };
      }),
      isAddress: vi.fn(() => true),
      parseEther: vi.fn((v: string) => BigInt(Math.round(parseFloat(v) * 1e18))),
      formatEther: vi.fn((v: bigint) => (Number(v) / 1e18).toString()),
      Interface,
    },
  };
});

import { ProtocolDeposit } from '../ProtocolDeposit';
import { useWallet } from '../../context/WalletContext';
import { useProtocol } from '../../context/ProtocolContext';

const mockWalletContext = {
  isConnected: true,
  address: '0x1234567890123456789012345678901234567890',
  signer: { getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890') },
  networkConfig: {
    chainId: 10,
    name: 'Optimism',
    addresses: {
      protocolAddress: '0x8C6f6ec2281D5678844556887DEDa5cEC907De87',
      dxnAddress: '0x90386DA49028ef1eF18F47f0a740cAAB50782576',
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

describe('ProtocolDeposit Transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useWallet as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockWalletContext);
    (useProtocol as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockProtocolContext);
    mockDeposit.mockResolvedValue({ hash: '0xdeposit123', wait: mockWait });
    mockDepositNoMint.mockResolvedValue({ hash: '0xdepositnomint123', wait: mockWait });
    mockApprove.mockResolvedValue({ hash: '0xapprove123', wait: mockWait });
    mockWait.mockResolvedValue({ status: 1 });
  });

  it('should call approve when approve button is clicked', async () => {
    render(
      React.createElement(ProtocolDeposit, {
        protocolAddress: '0x8C6f6ec2281D5678844556887DEDa5cEC907De87',
        dxnAddress: '0x90386DA49028ef1eF18F47f0a740cAAB50782576',
      })
    );

    const input = screen.getByPlaceholderText(/0.0 NXDv3/);
    fireEvent.change(input, { target: { value: '100' } });

    const approveButton = screen.getByText(/Approve DXNv2 for Protocol/);

    await act(async () => {
      fireEvent.click(approveButton);
    });

    expect(mockApprove).toHaveBeenCalled();
  });

  it('should handle deposit rejection', async () => {
    mockDeposit.mockRejectedValueOnce(new Error('User rejected'));
    (useProtocol as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockProtocolContext,
      userData: { ...mockProtocolContext.userData, dxnAllowance: 10000000000000000000000n },
    });

    render(
      React.createElement(ProtocolDeposit, {
        protocolAddress: '0x8C6f6ec2281D5678844556887DEDa5cEC907De87',
        dxnAddress: '0x90386DA49028ef1eF18F47f0a740cAAB50782576',
      })
    );

    const input = screen.getByPlaceholderText(/0.0 NXDv3/);
    fireEvent.change(input, { target: { value: '100' } });

    const depositButton = screen.getByText(/Deposit & Mint NXDv3/);

    await act(async () => {
      fireEvent.click(depositButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/rejected|error/i)).toBeInTheDocument();
    });
  });
  it('should successfully deposit & mint NXDv3', async () => {
    (useProtocol as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockProtocolContext,
      userData: { ...mockProtocolContext.userData, dxnAllowance: 10000000000000000000000n },
    });

    render(
      React.createElement(ProtocolDeposit, {
        protocolAddress: '0x8C6f6ec2281D5678844556887DEDa5cEC907De87',
        dxnAddress: '0x90386DA49028ef1eF18F47f0a740cAAB50782576',
      })
    );

    const input = screen.getByPlaceholderText(/0.0 NXDv3/);
    fireEvent.change(input, { target: { value: '50' } });

    const depositButton = screen.getByText(/Deposit & Mint NXDv3/);

    await act(async () => {
      fireEvent.click(depositButton);
    });

    expect(mockDeposit).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText(/successfully completed/i)).toBeInTheDocument();
    });
  });

  it('should switch to depositNoMint mode and perform depositNoMint transaction', async () => {
    (useProtocol as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockProtocolContext,
      userData: {
        ...mockProtocolContext.userData,
        dxnAllowance: 10000000000000000000000n,
        dxnBalance: 500000000000000000000n,
      },
    });

    render(
      React.createElement(ProtocolDeposit, {
        protocolAddress: '0x8C6f6ec2281D5678844556887DEDa5cEC907De87',
        dxnAddress: '0x90386DA49028ef1eF18F47f0a740cAAB50782576',
      })
    );

    const noMintModeButton = screen.getByRole('button', { name: /Deposit No Mint/i });
    fireEvent.click(noMintModeButton);

    const input = screen.getByPlaceholderText(/0.0 DXNv2/);
    fireEvent.change(input, { target: { value: '25' } });

    const submitButtons = screen.getAllByRole('button', { name: /Deposit No Mint/i });
    const submitBtn = submitButtons.find((btn) => btn.getAttribute('type') === 'submit')!;
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(mockDepositNoMint).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText(/without minting.*successfully completed/i)).toBeInTheDocument();
    });
  });

  it('should handle depositNoMint rejection error', async () => {
    mockDepositNoMint.mockRejectedValueOnce(new Error('User denied transaction signature'));
    (useProtocol as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockProtocolContext,
      userData: {
        ...mockProtocolContext.userData,
        dxnAllowance: 10000000000000000000000n,
      },
    });

    render(
      React.createElement(ProtocolDeposit, {
        protocolAddress: '0x8C6f6ec2281D5678844556887DEDa5cEC907De87',
        dxnAddress: '0x90386DA49028ef1eF18F47f0a740cAAB50782576',
      })
    );

    const noMintModeButton = screen.getByRole('button', { name: /Deposit No Mint/i });
    fireEvent.click(noMintModeButton);

    const input = screen.getByPlaceholderText(/0.0 DXNv2/);
    fireEvent.change(input, { target: { value: '10' } });

    const submitButtons = screen.getAllByRole('button', { name: /Deposit No Mint/i });
    const submitBtn = submitButtons.find((btn) => btn.getAttribute('type') === 'submit')!;
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('User denied transaction signature')).toBeInTheDocument();
    });
  });

  it('should handle approval rejection error gracefully', async () => {
    mockApprove.mockRejectedValueOnce(new Error('User rejected approval'));

    render(
      React.createElement(ProtocolDeposit, {
        protocolAddress: '0x8C6f6ec2281D5678844556887DEDa5cEC907De87',
        dxnAddress: '0x90386DA49028ef1eF18F47f0a740cAAB50782576',
      })
    );

    const input = screen.getByPlaceholderText(/0.0 NXDv3/);
    fireEvent.change(input, { target: { value: '100' } });

    const approveButton = screen.getByText(/Approve DXNv2 for Protocol/);
    await act(async () => {
      fireEvent.click(approveButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/rejected|Approval rejected/i)).toBeInTheDocument();
    });
  });

  it('should populate MAX value correctly in mint and nomint modes', () => {
    (useProtocol as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockProtocolContext,
      globalData: {
        ...mockProtocolContext.globalData,
        maxMintableDeposit: 1000000000000000000000000n,
      },
      userData: {
        ...mockProtocolContext.userData,
        dxnBalance: 500000000000000000000n,
      },
    });

    render(
      React.createElement(ProtocolDeposit, {
        protocolAddress: '0x8C6f6ec2281D5678844556887DEDa5cEC907De87',
        dxnAddress: '0x90386DA49028ef1eF18F47f0a740cAAB50782576',
      })
    );

    const maxBtn = screen.getByText('MAX');
    fireEvent.click(maxBtn);

    const input = screen.getByPlaceholderText(/0.0 NXDv3/) as HTMLInputElement;
    expect(input.value).toBeTruthy();

    const noMintModeButton = screen.getByRole('button', { name: /Deposit No Mint/i });
    fireEvent.click(noMintModeButton);

    const maxBtnNoMint = screen.getByText('MAX');
    fireEvent.click(maxBtnNoMint);

    const noMintInput = screen.getByPlaceholderText(/0.0 DXNv2/) as HTMLInputElement;
    expect(noMintInput.value).toBeTruthy();
  });

});
