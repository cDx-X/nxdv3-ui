/**
 * Integration test: DXNv2 → NXDv3 deposit journey.
 *
 * The real `ProtocolDeposit` component is rendered against a simulated chain and
 * a simulated wallet (`../harness/chainSim`), so the assertions cover the whole
 * loop: wallet state → component state → contract call → chain state → refreshed
 * UI. Transactions are mined explicitly, which lets us assert the intermediate
 * screens a user actually sees while a wallet confirmation is pending.
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

import { ProtocolDeposit } from '../../components/ProtocolDeposit';
import {
  changeInput,
  click as clickAndSubmit,
  connectWallet as connect,
  disconnectWallet,
  minePending as mine,
} from '../harness/acts';
import { CHAIN, ONE, chain, e18 } from '../harness/chainSim';

const APPROVE_LABEL = /Approve DXNv2 for Protocol/;
const MINT_SUBMIT_LABEL = /Deposit & Mint NXDv3/;

const renderDeposit = () => {
  const utils = render(
    <ProtocolDeposit protocolAddress={CHAIN.protocolAddress} dxnAddress={CHAIN.dxnAddress} />
  );
  return {
    ...utils,
    /** Submit button of the deposit form (label depends on the active mode). */
    submit: () =>
      utils.container.querySelector<HTMLButtonElement>(
        'form button[type="submit"]'
      ) as HTMLButtonElement,
    approve: () => screen.queryByRole('button', { name: APPROVE_LABEL }),
  };
};

const enterMintAmount = (value: string) =>
  changeInput(screen.getByPlaceholderText('0.0 NXDv3'), value);

describe('Integration: deposit DXNv2 to mint NXDv3', () => {
  beforeEach(() => {
    chain.reset();
  });

  it('shows the connect-wallet placeholder, then the real on-chain balances', async () => {
    chain.reset({ dxnBalance: e18(250) });
    renderDeposit();

    expect(screen.getByText(/Connect your wallet to view and use/)).toBeInTheDocument();

    await connect();

    expect(screen.getByText('Mint NXDv3 (Deposit DXNv2)')).toBeInTheDocument();
    expect(screen.getByText('250.0000')).toBeInTheDocument();
    expect(screen.getByText('1.0000 NXDv3')).toBeInTheDocument();
    expect(chain.connectCalls).toBe(1);

    // Disconnecting returns to the placeholder and empties the user data.
    await disconnectWallet();
    expect(screen.getByText(/Connect your wallet to view and use/)).toBeInTheDocument();
    expect(screen.queryByText('Mint NXDv3 (Deposit DXNv2)')).toBeNull();
  });

  it('completes approve → deposit and moves the simulated balances', async () => {
    chain.reset({ dxnBalance: e18(1000) });
    const { approve, submit } = renderDeposit();
    await connect();
    await enterMintAmount('100');

    // Allowance is 0 on-chain, so the primary action is the approval.
    expect(approve()).toBeInTheDocument();
    expect(submit()).toBeNull();

    // --- Step 1: approve -----------------------------------------------------
    await clickAndSubmit(approve() as HTMLElement);

    expect(chain.pending.map((tx) => tx.method)).toEqual(['approve']);
    expect(screen.getByText('Approving...')).toBeInTheDocument();
    expect(screen.getByText('DXN approval in progress...')).toBeInTheDocument();
    // Nothing is finalised until the transaction is mined.
    expect(chain.state.dxnAllowance).toBe(0n);

    await mine();

    expect(screen.getByText('DXN has been approved!')).toBeInTheDocument();
    expect(chain.state.dxnAllowance).toBe(e18(1_000_000_000));
    expect(chain.mined[0]?.contract).toBe(CHAIN.dxnAddress.toLowerCase());
    expect(chain.mined[0]?.method).toBe('approve');
    expect(chain.mined[0]?.args[0]).toBe(CHAIN.protocolAddress);

    // The refreshed allowance flips the primary action to the deposit.
    expect(approve()).toBeNull();
    expect(screen.getByRole('button', { name: MINT_SUBMIT_LABEL })).toBeInTheDocument();

    // --- Step 2: deposit ----------------------------------------------------
    await clickAndSubmit(screen.getByRole('button', { name: MINT_SUBMIT_LABEL }));

    expect(chain.pending.map((tx) => tx.method)).toEqual(['deposit']);
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByText('Payment sent to the network...')).toBeInTheDocument();
    expect(chain.state.dxnBalance).toBe(e18(1000)); // still untouched while pending

    await mine();

    expect(
      screen.getByText('Deposit and minting of NXDv3 successfully completed!')
    ).toBeInTheDocument();

    // Tier 1 mints at the oracle rate (1 DXNv2 = 1 NXDv3 in the simulator).
    expect(chain.mined[1]?.method).toBe('deposit');
    expect(chain.mined[1]?.args[0]).toBe(e18(100));
    expect(chain.state.dxnBalance).toBe(e18(900));
    expect(chain.state.nxdBalance).toBe(e18(100));
    expect(chain.state.nxdMintedViaDeposit).toBe(e18(100));

    // Refreshed UI reflects the new balances and the cleared input.
    expect(screen.getByText('900.0000')).toBeInTheDocument();
    expect((screen.getByPlaceholderText('0.0 NXDv3') as HTMLInputElement).value).toBe('');
    expect(chain.pending).toHaveLength(0);
  });
});

describe('Integration: deposit failure modes, modes and refreshes', () => {
  beforeEach(() => {
    chain.reset();
  });

  it('reports a wallet rejection and leaves the allowance untouched', async () => {
    const { approve } = renderDeposit();
    await connect();
    await enterMintAmount('100');

    chain.rejectNextCall(); // user pressed "Reject" in the wallet
    await clickAndSubmit(approve() as HTMLElement);

    expect(screen.getByText('User rejected transaction')).toBeInTheDocument();
    expect(chain.state.dxnAllowance).toBe(0n);
    expect(chain.pending).toHaveLength(0);
    expect(chain.mined).toHaveLength(0);
    expect(approve()).toBeEnabled();
  });

  it('reports an on-chain revert while mining and keeps the form usable', async () => {
    chain.reset({ dxnBalance: e18(1000), dxnAllowance: e18(1_000_000_000) });
    const { submit } = renderDeposit();
    await connect();
    await enterMintAmount('100');

    expect(submit()).toBeEnabled();
    await clickAndSubmit(submit());

    expect(chain.pending[0]?.args[0]).toBe(ONE * 100n);

    await mine({ revertFirstTxWith: 'MintingFinished' });

    expect(screen.getByText('Minting has been finished for this tier.')).toBeInTheDocument();
    expect(chain.mined[0]?.error).toBeDefined();
    expect(chain.mined[0]?.receipt).toBeUndefined();
    // A reverted transaction must not move any balance.
    expect(chain.state.dxnBalance).toBe(e18(1000));
    expect(chain.state.nxdMintedViaDeposit).toBe(0n);
    expect(submit()).toBeEnabled();
  });

  it('deposits without minting when the no-mint mode is selected', async () => {
    chain.reset({ dxnBalance: e18(1000), dxnAllowance: e18(1_000_000_000) });
    const { submit } = renderDeposit();
    await connect();

    await clickAndSubmit(screen.getByRole('button', { name: 'Deposit No Mint' }));
    expect(screen.getByPlaceholderText('0.0 DXNv2')).toBeInTheDocument();
    expect(screen.getByText(/stake directly into DBXenV2 without minting/i)).toBeInTheDocument();

    await changeInput(screen.getByPlaceholderText('0.0 DXNv2'), '100');
    await clickAndSubmit(submit());
    await mine();

    expect(
      screen.getByText('Deposit without minting (DBXenV2 stake) successfully completed!')
    ).toBeInTheDocument();
    expect(chain.mined[0]?.method).toBe('depositNoMint');
    expect(chain.state.dxnBalance).toBe(e18(900));
    expect(chain.state.nxdMintedViaDeposit).toBe(0n);
    expect(chain.state.nxdBalance).toBe(0n);
    expect(chain.state.totalDXNStaked).toBe(e18(100));
  });

  it('publishes externally mined chain state only after a refresh', async () => {
    const { container } = renderDeposit();
    await connect();

    expect(screen.getByText('1000.0000')).toBeInTheDocument();

    // Somebody else acted on-chain: committed state changed, the app view did not.
    chain.setChainState({ dxnBalance: e18(250) });
    expect(screen.getByText('1000.0000')).toBeInTheDocument();

    const refreshesBefore = chain.refreshCalls;
    await clickAndSubmit(screen.getByTitle('Refresh data'));

    expect(chain.refreshCalls).toBeGreaterThan(refreshesBefore);
    expect(screen.getByText('250.0000')).toBeInTheDocument();
    expect(container.querySelector('.stat-value')).toBeInTheDocument();
  });
});
