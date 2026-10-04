/**
 * Integration test: NXDv3 staking, withdrawals and reward claiming.
 *
 * Same harness as `DepositFlow.test.tsx`: the real `VaultStaking` component talks
 * to the simulated chain, so approvals, staking, the 24h cooldown, the instant
 * withdrawal penalty and reward claims are verified against real state
 * transitions instead of "was the mocked function called".
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../context/WalletContext', async () => {
  const { makeWalletContextMock } = await import('../harness/contextMocks');
  return makeWalletContextMock();
});

vi.mock('../../context/ProtocolContext', async () => {
  const { makeProtocolContextMock } = await import('../harness/contextMocks');
  return makeProtocolContextMock();
});

vi.mock('ethers', async () => {
  const { makeEthersMock } = await import('../harness/contextMocks');
  return makeEthersMock();
});

import { VaultStaking } from '../../components/VaultStaking';
import { changeInput, click, connectWallet, minePending } from '../harness/acts';
import { CHAIN, chain, e18 } from '../harness/chainSim';

const AUTHORIZE_LABEL = /Authorize NXDv3 for Vault/;
const STAKE_SUBMIT_LABEL = /Stake NXDv3/;

const renderVault = () => {
  const utils = render(
    <VaultStaking vaultAddress={CHAIN.vaultAddress} nxdAddress={CHAIN.nxdAddress} />
  );
  return {
    ...utils,
    submit: () =>
      utils.container.querySelector<HTMLButtonElement>(
        'form button[type="submit"]'
      ) as HTMLButtonElement,
    authorize: () => screen.queryByRole('button', { name: AUTHORIZE_LABEL }),
    withdrawInput: () =>
      utils.container.querySelector<HTMLInputElement>('#withdrawAmount') as HTMLInputElement,
  };
};

const fillStakeAmount = (value: string) =>
  changeInput(screen.getByPlaceholderText('0.0 NXDv3'), value);

const openWithdrawTab = () => click(screen.getByRole('button', { name: 'Withdraw' }));

describe('Integration: stake NXDv3 in the vault', () => {
  beforeEach(() => {
    chain.reset();
  });

  it('authorizes the vault and then stakes, updating both wallet and vault stats', async () => {
    chain.reset({ nxdBalance: e18(500) });
    const { submit, authorize } = renderVault();

    await connectWallet();

    expect(screen.getByText('Staking & Rewards')).toBeInTheDocument();
    expect(screen.getByText(/Available in wallet: 500.0000 NXDv3/)).toBeInTheDocument();

    await fillStakeAmount('200');

    // No allowance yet → the vault has to be authorized first.
    expect(authorize()).toBeInTheDocument();
    expect(submit()).toBeNull();

    await click(authorize() as HTMLElement);

    expect(chain.pending.map((tx) => tx.method)).toEqual(['approve']);
    expect(screen.getByText('Approving...')).toBeInTheDocument();
    expect(screen.getByText('Approving NXDv3 in progress...')).toBeInTheDocument();
    expect(chain.state.nxdAllowance).toBe(0n);

    await minePending();

    expect(screen.getByText('Successfully approved NXDv3 for Vault!')).toBeInTheDocument();
    expect(chain.mined[0]?.contract).toBe(CHAIN.nxdAddress.toLowerCase());
    expect(chain.mined[0]?.args[0]).toBe(CHAIN.vaultAddress);
    expect(chain.state.nxdAllowance).toBe(e18(1_000_000_000));
    expect(authorize()).toBeNull();

    await click(screen.getByRole('button', { name: STAKE_SUBMIT_LABEL }));

    expect(chain.pending.map((tx) => tx.method)).toEqual(['deposit']);
    expect(screen.getByText('Vault deposit sent...')).toBeInTheDocument();
    expect(chain.state.stakedBalance).toBe(0n);

    await minePending();

    expect(screen.getByText('Successfully staked NXDv3!')).toBeInTheDocument();
    expect(chain.mined[1]?.contract).toBe(CHAIN.vaultAddress.toLowerCase());
    expect(chain.mined[1]?.args[0]).toBe(e18(200));
    expect(chain.state.nxdBalance).toBe(e18(300));
    expect(chain.state.stakedBalance).toBe(e18(200));
    expect(chain.state.totalVaultStaked).toBe(e18(200));

    // Refreshed stats: user stake (4 decimals) and vault total (2 decimals).
    expect(screen.getByText('200.0000')).toBeInTheDocument();
    expect(screen.getByText('200.00')).toBeInTheDocument();
    expect(screen.getByText(/Available in wallet: 300.0000 NXDv3/)).toBeInTheDocument();
  });

  it('withdraws instantly with the 25% penalty deducted', async () => {
    chain.reset({ nxdBalance: 0n, stakedBalance: e18(100), totalVaultStaked: e18(100) });
    const { withdrawInput } = renderVault();
    await connectWallet();
    await openWithdrawTab();

    await changeInput(withdrawInput(), '100');
    await click(screen.getByRole('button', { name: 'Withdraw Now (25% Penalty)' }));

    expect(screen.getByText('Withdrawal request sent...')).toBeInTheDocument();
    expect(chain.state.stakedBalance).toBe(e18(100));

    await minePending();

    expect(
      screen.getByText('Successfully withdrawn instantly with penalty deduction!')
    ).toBeInTheDocument();
    expect(chain.mined[0]?.method).toBe('withdraw');
    expect(chain.mined[0]?.args[1]).toBe(true);
    expect(chain.state.stakedBalance).toBe(0n);
    expect(chain.state.totalVaultStaked).toBe(0n);
    expect(chain.state.nxdBalance).toBe(e18(75)); // 100 - 25% penalty

    // Back on the stake tab the wallet reports the penalised amount.
    await click(screen.getByRole('button', { name: 'Stake' }));
    expect(screen.getByText(/Available in wallet: 75.0000 NXDv3/)).toBeInTheDocument();
  });

  it('requests a 24h-cooldown withdrawal and finalises it once the cooldown passed', async () => {
    chain.reset({ nxdBalance: 0n, stakedBalance: e18(100), totalVaultStaked: e18(100) });
    const { withdrawInput } = renderVault();
    await connectWallet();
    await openWithdrawTab();

    await changeInput(withdrawInput(), '100');
    await click(screen.getByRole('button', { name: 'Request Withdrawal (24h Cooldown)' }));
    await minePending();

    expect(screen.getByText('Withdrawal requested (24h cooldown).')).toBeInTheDocument();
    expect(chain.mined[0]?.args[1]).toBe(false);
    expect(chain.state.cooldownRequest?.amount).toBe(e18(100));
    // Funds stay locked inside the vault while the cooldown is running.
    expect(chain.state.stakedBalance).toBe(e18(100));
    expect(screen.getByText(/Pending withdrawal request:/)).toBeInTheDocument();
    expect(screen.getByText(/Available after:/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Claim Withdrawal' })).toBeNull();

    // 24 hours later: the vault reports the request as claimable.
    const request = chain.state.cooldownRequest;
    expect(request).not.toBeNull();
    chain.setChainState({
      cooldownRequest: {
        amount: request?.amount ?? 0n,
        releaseTime: Math.floor(Date.now() / 1000) - 60,
      },
    });
    await click(screen.getByTitle('Refresh data'));

    expect(screen.getByText(/Cooldown has passed/)).toBeInTheDocument();
    await click(screen.getByRole('button', { name: 'Claim Withdrawal' }));
    await minePending();

    expect(screen.getByText('Successfully claimed NXDv3!')).toBeInTheDocument();
    expect(chain.mined.at(-1)?.method).toBe('withdrawCooldown');
    expect(chain.state.cooldownRequest).toBeNull();
    expect(chain.state.stakedBalance).toBe(0n);
    expect(chain.state.totalVaultStaked).toBe(0n);
    expect(chain.state.nxdBalance).toBe(e18(100));
  });

  it('claims accumulated ETH and XEN rewards and hides the claim panel afterwards', async () => {
    chain.reset({
      nxdBalance: 0n,
      stakedBalance: e18(100),
      totalVaultStaked: e18(100),
      pendingETH: e18('2.5'),
      pendingXEN: e18(1000),
    });
    renderVault();
    await connectWallet();

    expect(screen.getByText('2.500000')).toBeInTheDocument();
    expect(screen.getByText('1000.000000')).toBeInTheDocument();

    await click(screen.getByRole('button', { name: 'Claim All' }));

    expect(screen.getByText('Claiming all rewards...')).toBeInTheDocument();
    expect(chain.state.pendingETH).toBe(e18('2.5'));

    await minePending();

    expect(screen.getByText('All rewards claimed successfully!')).toBeInTheDocument();
    expect(chain.mined[0]?.method).toBe('claimRewards');
    expect(chain.state.pendingETH).toBe(0n);
    expect(chain.state.pendingXEN).toBe(0n);
    expect(chain.state.claimedETH).toBe(e18('2.5'));
    expect(chain.state.claimedXEN).toBe(e18(1000));
    expect(screen.queryByRole('button', { name: 'Claim All' })).toBeNull();
  });
});
