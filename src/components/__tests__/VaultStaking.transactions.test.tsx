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
const mockWithdraw = vi.fn().mockResolvedValue({ hash: '0xwithdraw123' });
const mockApprove = vi.fn().mockResolvedValue({ hash: '0xapprove123' });
const mockInitiateCooldown = vi.fn().mockResolvedValue({ hash: '0xcooldown123' });
const mockWithdrawCooldown = vi.fn().mockResolvedValue({ hash: '0xwithdraw123' });
const mockClaimRewards = vi.fn().mockResolvedValue({ hash: '0xclaim123' });
const mockClaimRewardsTo = vi.fn().mockResolvedValue({ hash: '0xclaimTo123' });
const mockClaimETH = vi.fn().mockResolvedValue({ hash: '0xclaimETH123' });
const mockClaimETHTo = vi.fn().mockResolvedValue({ hash: '0xclaimETHTo123' });
const mockClaimXEN = vi.fn().mockResolvedValue({ hash: '0xclaimXEN123' });
const mockClaimXENTo = vi.fn().mockResolvedValue({ hash: '0xclaimXENTo123' });
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
          withdraw: mockWithdraw,
          approve: mockApprove,
          initiateCooldown: mockInitiateCooldown,
          withdrawCooldown: mockWithdrawCooldown,
          claimRewards: mockClaimRewards,
          claimRewardsTo: mockClaimRewardsTo,
          claimETH: mockClaimETH,
          claimETHTo: mockClaimETHTo,
          claimXEN: mockClaimXEN,
          claimXENTo: mockClaimXENTo,
        };
      }),
      isAddress: vi.fn((addr: string) => {
        return typeof addr === 'string' && /^0x[0-9a-fA-F]{40}$/.test(addr);
      }),
      parseEther: vi.fn((v: string) => BigInt(parseFloat(v) * 1e18)),
      formatEther: vi.fn((v: bigint) => (Number(v) / 1e18).toString()),
      MaxUint256: 115792089237316195423570985008687907853269984665640564039457584007913129639935n,
      Interface,
    },
  };
});

import { VaultStaking } from '../VaultStaking';
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
      vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
      nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
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
    totalVaultStaked: 10000000000000000000000n,
  },
  userData: {
    isLoaded: true,
    nxdBalance: 500000000000000000000n,
    nxdAllowance: 0n,
    stakedBalance: 100000000000000000000n,
    pendingETH: 50000000000000000n,
    pendingXEN: 1000000000000000000000n,
    cooldownRequest: null as { amount: bigint; releaseTime: number } | null,
  },
  refreshAll: vi.fn(),
  refreshGlobal: vi.fn(),
  refreshUser: vi.fn(),
  isLoadingGlobal: false,
  setIsLoadingGlobal: vi.fn(),
};

describe('VaultStaking Transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useWallet as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockWalletContext);
    (useProtocol as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockProtocolContext);
    mockDeposit.mockResolvedValue({ hash: '0xdeposit123', wait: mockWait });
    mockWithdraw.mockResolvedValue({ hash: '0xwithdraw123', wait: mockWait });
    mockApprove.mockResolvedValue({ hash: '0xapprove123', wait: mockWait });
    mockInitiateCooldown.mockResolvedValue({ hash: '0xcooldown123', wait: mockWait });
    mockWithdrawCooldown.mockResolvedValue({ hash: '0xwithdraw123', wait: mockWait });
    mockClaimRewards.mockResolvedValue({ hash: '0xclaim123', wait: mockWait });
    mockClaimRewardsTo.mockResolvedValue({ hash: '0xclaimTo123', wait: mockWait });
    mockClaimETH.mockResolvedValue({ hash: '0xclaimETH123', wait: mockWait });
    mockClaimETHTo.mockResolvedValue({ hash: '0xclaimETHTo123', wait: mockWait });
    mockClaimXEN.mockResolvedValue({ hash: '0xclaimXEN123', wait: mockWait });
    mockClaimXENTo.mockResolvedValue({ hash: '0xclaimXENTo123', wait: mockWait });
    mockWait.mockResolvedValue({ status: 1 });
  });

  it('should call approve when authorize button is clicked with entered amount', async () => {
    render(
      React.createElement(VaultStaking, {
        vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
        nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
      })
    );

    const input = screen.getByPlaceholderText('0.0 NXDv3');
    fireEvent.change(input, { target: { value: '50' } });

    const authorizeButton = screen.getByText(/Authorize NXDv3 for Vault/i);

    await act(async () => {
      fireEvent.click(authorizeButton);
    });

    expect(mockApprove).toHaveBeenCalled();
  });

  it('should call stake when stake button is clicked with valid amount and allowance', async () => {
    (useProtocol as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockProtocolContext,
      userData: {
        ...mockProtocolContext.userData,
        nxdAllowance: 10000000000000000000000n,
      },
    });

    render(
      React.createElement(VaultStaking, {
        vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
        nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
      })
    );

    const input = screen.getByPlaceholderText('0.0 NXDv3');
    fireEvent.change(input, { target: { value: '50' } });

    const stakeButton = screen.getByText('Stake NXDv3');

    await act(async () => {
      fireEvent.click(stakeButton);
    });

    expect(mockDeposit).toHaveBeenCalled();
  });

  it('should handle stake transaction rejection gracefully', async () => {
    mockDeposit.mockRejectedValueOnce(new Error('User rejected the transaction'));
    (useProtocol as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockProtocolContext,
      userData: {
        ...mockProtocolContext.userData,
        nxdAllowance: 10000000000000000000000n,
      },
    });

    render(
      React.createElement(VaultStaking, {
        vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
        nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
      })
    );

    const input = screen.getByPlaceholderText('0.0 NXDv3');
    fireEvent.change(input, { target: { value: '50' } });

    const stakeButton = screen.getByText('Stake NXDv3');

    await act(async () => {
      fireEvent.click(stakeButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/rejected|error|failed/i)).toBeInTheDocument();
    });
  });

  it('should call claimRewards when claim all rewards button is clicked', async () => {
    render(
      React.createElement(VaultStaking, {
        vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
        nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
      })
    );

    const claimAllButton = screen.getByText('Claim All');

    await act(async () => {
      fireEvent.click(claimAllButton);
    });

    expect(mockClaimRewards).toHaveBeenCalled();
  });

  it('should call claimETH when claim ETH button is clicked', async () => {
    render(
      React.createElement(VaultStaking, {
        vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
        nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
      })
    );

    const claimEthButton = screen.getByText('Claim ETH');

    await act(async () => {
      fireEvent.click(claimEthButton);
    });

    expect(mockClaimETH).toHaveBeenCalled();
  });

  it('should call claimXEN when claim XEN button is clicked', async () => {
    render(
      React.createElement(VaultStaking, {
        vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
        nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
      })
    );

    const claimXenButton = screen.getByText('Claim XEN');

    await act(async () => {
      fireEvent.click(claimXenButton);
    });

    expect(mockClaimXEN).toHaveBeenCalled();
  });

  it('should switch to Custom Address mode and claimRewardsTo recipient', async () => {
    const customRecipient = '0x1111111111111111111111111111111111111111';
    render(
      React.createElement(VaultStaking, {
        vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
        nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
      })
    );

    // Switch to Custom Address toggle
    const customAddressToggle = screen.getByText('Custom Address');
    fireEvent.click(customAddressToggle);

    const recipientInput = screen.getByPlaceholderText('0x... recipient address');
    fireEvent.change(recipientInput, { target: { value: customRecipient } });

    const claimAllButton = screen.getByText('Claim All');
    await act(async () => {
      fireEvent.click(claimAllButton);
    });

    expect(mockClaimRewardsTo).toHaveBeenCalledWith(customRecipient);
  });

  it('should claimETHTo recipient when Custom Address is selected', async () => {
    const customRecipient = '0x2222222222222222222222222222222222222222';
    render(
      React.createElement(VaultStaking, {
        vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
        nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
      })
    );

    const customAddressToggle = screen.getByText('Custom Address');
    fireEvent.click(customAddressToggle);

    const recipientInput = screen.getByPlaceholderText('0x... recipient address');
    fireEvent.change(recipientInput, { target: { value: customRecipient } });

    const claimEthButton = screen.getByText('Claim ETH');
    await act(async () => {
      fireEvent.click(claimEthButton);
    });

    expect(mockClaimETHTo).toHaveBeenCalledWith(customRecipient);
  });

  it('should claimXENTo recipient when Custom Address is selected', async () => {
    const customRecipient = '0x3333333333333333333333333333333333333333';
    render(
      React.createElement(VaultStaking, {
        vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
        nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
      })
    );

    const customAddressToggle = screen.getByText('Custom Address');
    fireEvent.click(customAddressToggle);

    const recipientInput = screen.getByPlaceholderText('0x... recipient address');
    fireEvent.change(recipientInput, { target: { value: customRecipient } });

    const claimXenButton = screen.getByText('Claim XEN');
    await act(async () => {
      fireEvent.click(claimXenButton);
    });

    expect(mockClaimXENTo).toHaveBeenCalledWith(customRecipient);
  });

  it('should show error when claiming to an invalid address', async () => {
    render(
      React.createElement(VaultStaking, {
        vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
        nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
      })
    );

    const customAddressToggle = screen.getByText('Custom Address');
    fireEvent.click(customAddressToggle);

    const recipientInput = screen.getByPlaceholderText('0x... recipient address');
    fireEvent.change(recipientInput, { target: { value: 'invalid-eth-address' } });

    const claimAllButton = screen.getByText('Claim All');
    await act(async () => {
      fireEvent.click(claimAllButton);
    });

    expect(mockClaimRewardsTo).not.toHaveBeenCalled();
    expect(screen.getByText('Invalid recipient address')).toBeInTheDocument();
  });

  it('should show withdrawCooldown button when cooldown has completed', async () => {
    (useProtocol as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockProtocolContext,
      userData: {
        ...mockProtocolContext.userData,
        cooldownRequest: {
          amount: 50000000000000000000n,
          releaseTime: Math.floor(Date.now() / 1000) - 100, // already unlocked
        },
      },
    });

    render(
      React.createElement(VaultStaking, {
        vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
        nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
      })
    );

    const claimWithdrawalButton = screen.getByText('Claim Withdrawal');
    expect(claimWithdrawalButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(claimWithdrawalButton);
    });

    expect(mockWithdrawCooldown).toHaveBeenCalled();
  });

  it('should call withdraw with cooldown when requested', async () => {
    render(
      React.createElement(VaultStaking, {
        vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
        nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
      })
    );

    const withdrawTab = screen.getByText('Withdraw');
    fireEvent.click(withdrawTab);

    const input = screen.getByPlaceholderText('0.0 NXDv3');
    fireEvent.change(input, { target: { value: '25' } });

    const cooldownBtn = screen.getByText('Request Withdrawal (24h Cooldown)');
    await act(async () => {
      fireEvent.click(cooldownBtn);
    });

    expect(mockWithdraw).toHaveBeenCalledWith(expect.anything(), false);
  });

  it('should call withdraw with instant penalty when penalty button is clicked', async () => {
    render(
      React.createElement(VaultStaking, {
        vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
        nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
      })
    );

    const withdrawTab = screen.getByText('Withdraw');
    fireEvent.click(withdrawTab);

    const input = screen.getByPlaceholderText('0.0 NXDv3');
    fireEvent.change(input, { target: { value: '25' } });

    const penaltyBtn = screen.getByText('Withdraw Now (25% Penalty)');
    await act(async () => {
      fireEvent.click(penaltyBtn);
    });

    expect(mockWithdraw).toHaveBeenCalledWith(expect.anything(), true);
  });

  it('should display active cooldown timer and disable claim until releaseTime has passed', async () => {
    (useProtocol as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockProtocolContext,
      userData: {
        ...mockProtocolContext.userData,
        stakedBalance: 100000000000000000000n, // 100 NXD
        cooldownRequest: {
          amount: 40000000000000000000n, // 40 NXD
          releaseTime: Math.floor(Date.now() / 1000) + 86400, // in 24 hours
        },
      },
    });

    render(
      React.createElement(VaultStaking, {
        vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
        nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
      })
    );

    // Should display pending withdrawal request notice with amount
    expect(screen.getByText(/Pending withdrawal request:/i)).toBeInTheDocument();
    expect(screen.getByText(/40\.0000 NXDv3/i)).toBeInTheDocument();
    expect(screen.getByText(/Available after:/i)).toBeInTheDocument();

    // Claim Withdrawal button should NOT be shown before releaseTime
    expect(screen.queryByText('Claim Withdrawal')).not.toBeInTheDocument();

    // In Withdraw tab, MAX button should calculate available amount excluding active cooldown
    const withdrawTab = screen.getByText('Withdraw');
    fireEvent.click(withdrawTab);

    expect(screen.getByText(/Active cooldown: 40\.0000/i)).toBeInTheDocument();

    const maxBtn = screen.getByText('MAX');
    fireEvent.click(maxBtn);

    const input = screen.getByPlaceholderText('0.0 NXDv3') as HTMLInputElement;
    expect(input.value).toBe('60');
  });

  it('should disable withdrawal buttons when withdraw amount is empty or zero', async () => {
    render(
      React.createElement(VaultStaking, {
        vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
        nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
      })
    );

    const withdrawTab = screen.getByText('Withdraw');
    fireEvent.click(withdrawTab);

    const cooldownBtn = screen.getByText('Request Withdrawal (24h Cooldown)');
    const penaltyBtn = screen.getByText('Withdraw Now (25% Penalty)');

    // Initially empty
    expect(cooldownBtn).toBeDisabled();
    expect(penaltyBtn).toBeDisabled();

    // Set to 0
    const input = screen.getByPlaceholderText('0.0 NXDv3');
    fireEvent.change(input, { target: { value: '0' } });
    expect(cooldownBtn).toBeDisabled();
    expect(penaltyBtn).toBeDisabled();
  });

  it('should handle withdrawal transaction error gracefully', async () => {
    mockWithdraw.mockRejectedValueOnce(new Error('User rejected withdrawal transaction'));

    render(
      React.createElement(VaultStaking, {
        vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
        nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
      })
    );

    const withdrawTab = screen.getByText('Withdraw');
    fireEvent.click(withdrawTab);

    const input = screen.getByPlaceholderText('0.0 NXDv3');
    fireEvent.change(input, { target: { value: '15' } });

    const penaltyBtn = screen.getByText('Withdraw Now (25% Penalty)');
    await act(async () => {
      fireEvent.click(penaltyBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/rejected|error|failed/i)).toBeInTheDocument();
    });
  });

  it('should toggle custom recipient inputs and populate with Use Mine button', async () => {
    render(
      React.createElement(VaultStaking, {
        vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
        nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
      })
    );

    const customToggle = screen.getByText('Custom Address');
    fireEvent.click(customToggle);

    const recipientInput = screen.getByPlaceholderText(
      '0x... recipient address'
    ) as HTMLInputElement;
    expect(recipientInput).toBeInTheDocument();
    // Initially auto-populated with user's address
    expect(recipientInput.value).toBe(mockWalletContext.address);

    // Change input value to something else
    fireEvent.change(recipientInput, {
      target: { value: '0x9999999999999999999999999999999999999999' },
    });
    expect(recipientInput.value).toBe('0x9999999999999999999999999999999999999999');

    // Click "Use Mine" button to reset to user's address
    const useMineBtn = screen.getByText('Use Mine');
    fireEvent.click(useMineBtn);
    expect(recipientInput.value).toBe(mockWalletContext.address);
  });

  it('should show Claim Withdrawal button and call withdrawCooldown when releaseTime has passed', async () => {
    (useProtocol as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockProtocolContext,
      userData: {
        ...mockProtocolContext.userData,
        cooldownRequest: {
          amount: 50000000000000000000n, // 50 NXD
          releaseTime: Math.floor(Date.now() / 1000) - 100, // already passed
        },
      },
    });

    render(
      React.createElement(VaultStaking, {
        vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
        nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
      })
    );

    expect(screen.getByText('Cooldown has passed. You can claim your funds!')).toBeInTheDocument();
    const claimWithdrawalBtn = screen.getByText('Claim Withdrawal');
    expect(claimWithdrawalBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(claimWithdrawalBtn);
    });

    expect(mockWithdrawCooldown).toHaveBeenCalled();
  });
});
