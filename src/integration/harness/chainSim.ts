/**
 * Deterministic in-memory "chain" used by the integration test suite.
 *
 * It complements the unit tests (which only assert that a mocked contract method
 * was called) by modelling the *state* of the protocol: token balances,
 * allowances, staked amounts, pending rewards and the 24h withdrawal cooldown.
 *
 * Components under test are the real ones; only the transport layer
 * (`ethers.Contract`) and the app contexts (`useWallet` / `useProtocol`) are
 * wired to this simulator, so a full user journey can be exercised:
 *
 *   Connect wallet -> Approve -> Deposit -> balances refresh
 *
 * Transactions are intentionally *not* mined automatically. A test can therefore
 * observe the intermediate UI ("Approving...", "Payment sent to the network...")
 * before calling `chain.mine()` to finalise the block, or `chain.mine({ revert })`
 * to simulate an on-chain revert.
 */

export const CHAIN = {
  userAddress: '0x1111111111111111111111111111111111111111',
  otherAddress: '0x2222222222222222222222222222222222222222',
  protocolAddress: '0x8C6f6ec2281D5678844556887DEDa5cEC907De87',
  vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
  nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
  dxnAddress: '0x90386DA49028ef1eF18F47f0a740cAAB50782576',
  xenAddress: '0xeB585163DEbB1E637c6D617de3bEF99347cd75c8',
  taxRecipientAddress: '0x8ae6A0Ab65cE133365760F11367d5353BBcf5f40',
} as const;

export const NETWORK_NAME = 'Optimism';
export const CHAIN_ID = 10;
export const ONE = 10n ** 18n;
export const COOLDOWN_SECONDS = 24 * 60 * 60;

export const e18 = (value: string | number): bigint => {
  const [whole, decimals = ''] = String(value).split('.');
  const padded = (decimals + '0'.repeat(18)).slice(0, 18);
  const negative = whole.startsWith('-');
  const digits = `${negative ? '' : whole}${padded}`.replace(/^0+(?=\d)/, '');
  const result = BigInt(digits || '0');
  return negative ? -result : result;
};

export interface CooldownRequest {
  amount: bigint;
  releaseTime: number;
}

export interface ChainState {
  // Token balances / allowances of the connected user
  dxnBalance: bigint;
  dxnAllowance: bigint;
  nxdBalance: bigint;
  nxdAllowance: bigint;
  // Vault accounting
  stakedBalance: bigint;
  totalVaultStaked: bigint;
  pendingETH: bigint;
  pendingXEN: bigint;
  claimedETH: bigint;
  claimedXEN: bigint;
  cooldownRequest: CooldownRequest | null;
  // Protocol accounting
  totalDXNStaked: bigint;
  nxdMintedViaDeposit: bigint;
  currentRate: bigint;
  tierSize: bigint;
  maxMintableDeposit: bigint;
  maxRewardsSupply: bigint;
  emergencyWithdrawEnabled: boolean;
}

export const DEFAULT_STATE: ChainState = {
  dxnBalance: e18(1000),
  dxnAllowance: 0n,
  nxdBalance: 0n,
  nxdAllowance: 0n,
  stakedBalance: 0n,
  totalVaultStaked: 0n,
  pendingETH: 0n,
  pendingXEN: 0n,
  claimedETH: 0n,
  claimedXEN: 0n,
  cooldownRequest: null,
  totalDXNStaked: 0n,
  nxdMintedViaDeposit: 0n,
  currentRate: ONE,
  tierSize: e18(1_000_000),
  maxMintableDeposit: e18(3_000_000),
  maxRewardsSupply: e18(3_000_000),
  emergencyWithdrawEnabled: false,
};

export interface RecordedTx {
  hash: string;
  contract: string;
  method: string;
  args: unknown[];
  error?: unknown;
  receipt?: { status: number; blockNumber: number };
}

export interface TxReceipt {
  status: number;
  blockNumber: number;
}

interface PendingTx {
  hash: string;
  contract: string;
  method: string;
  args: unknown[];
  /** Applies the state transition. Throwing here is treated as a revert. */
  apply: () => void;
  settle: (receipt: TxReceipt) => void;
  fail: (error: unknown) => void;
}

export interface MineOptions {
  /**
   * Makes the *first* pending transaction revert while it is mined (the classic
   * "transaction was mined but execution reverted" case). A string is treated as
   * the solidity revert reason.
   */
  revertFirstTxWith?: unknown;
}

export interface GlobalSnapshotData {
  effectiveSupply: bigint;
  totalMinted: bigint;
  totalNXDBurned: bigint;
  totalDXNBurned: bigint;
  totalDXNStaked: bigint;
  totalETHSentToVault: bigint;
  totalXENSentToVault: bigint;
  nxdMaxSupply: bigint;
  burnedPercentage: number;
  nxdMintedViaDeposit: bigint;
  maxMintableDeposit: bigint;
  currentRate: bigint;
  tierSize: bigint;
  maxRewardsSupply: bigint;
  nxdTotalSupply: bigint;
  totalVaultStaked: bigint;
  emergencyWithdrawEnabled: boolean;
  xenVaultBalance: bigint;
  totalETHToStakingVault: bigint;
  totalXENBought: bigint;
  isLoaded: boolean;
}

export interface UserSnapshotData {
  dxnBalance: bigint;
  dxnAllowance: bigint;
  nxdBalance: bigint;
  nxdAllowance: bigint;
  stakedBalance: bigint;
  pendingETH: bigint;
  pendingXEN: bigint;
  cooldownRequest: CooldownRequest | null;
  isLoaded: boolean;
}

export interface ProtocolSnapshot {
  globalData: GlobalSnapshotData;
  userData: UserSnapshotData;
  refreshAll: (force?: boolean) => Promise<void>;
  refreshGlobal: (force?: boolean) => Promise<void>;
  refreshUser: (force?: boolean) => Promise<void>;
  isLoadingGlobal: boolean;
  setIsLoadingGlobal: (value: boolean) => void;
}

export interface WalletSnapshot {
  isConnected: boolean;
  address: string | null;
  signer: { getAddress: () => Promise<string> } | null;
  chainId: number;
  networkConfig: { chainId: number; name: string; addresses: Record<string, string> };
  networkWarning: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
  error: string | null;
  initError: string | null;
  isConnecting: boolean;
}

/**
 * Simulated Optimism node + wallet. `subscribe` / `getXSnapshot` follow the
 * `useSyncExternalStore` contract so the mocked React contexts re-render exactly
 * when the simulated chain or wallet changes.
 */
export class ChainSimulator {
  state: ChainState = { ...DEFAULT_STATE };
  isConnected = false;
  address: string | null = null;
  chainId: number = CHAIN_ID;
  networkWarning: string | null = null;
  /** When true every transaction is mined on the next microtask. */
  autoMine = false;
  /** Number of times the app asked for a data refresh. */
  refreshCalls = 0;
  connectCalls = 0;
  switchNetworkCalls: number[] = [];
  pending: PendingTx[] = [];
  mined: RecordedTx[] = [];

  private txCounter = 0;
  private blockNumber = 1_000;
  private version = 0;
  private readonly listeners = new Set<() => void>();
  private nextCallError: unknown = null;
  private view: ChainState | null = null;
  private cachedProtocol: ProtocolSnapshot | null = null;
  private cachedWallet: WalletSnapshot | null = null;

  /** Resets the simulated chain; call this from `beforeEach`. */
  reset(overrides: Partial<ChainState> = {}): void {
    this.state = { ...DEFAULT_STATE, ...overrides };
    this.isConnected = false;
    this.address = null;
    this.chainId = CHAIN_ID;
    this.networkWarning = null;
    this.autoMine = false;
    this.refreshCalls = 0;
    this.connectCalls = 0;
    this.switchNetworkCalls = [];
    this.pending = [];
    this.mined = [];
    this.txCounter = 0;
    this.blockNumber = 1_000;
    this.nextCallError = null;
    this.view = this.cloneState();
    this.touch();
  }

  // Wallet-side mutation helpers (no React involved).

  connect(): void {
    this.connectCalls += 1;
    this.isConnected = true;
    this.address = CHAIN.userAddress;
    this.chainId = CHAIN_ID;
    this.networkWarning = null;
    this.touch();
  }

  disconnect(): void {
    this.isConnected = false;
    this.address = null;
    this.touch();
  }

  setAddress(address: string | null): void {
    this.address = address;
    this.isConnected = Boolean(address);
    this.touch();
  }

  setNetworkWarning(warning: string | null): void {
    this.networkWarning = warning;
    this.touch();
  }

  /** Directly rewrites committed chain state (as if somebody else acted on-chain). */
  setChainState(overrides: Partial<ChainState>): void {
    this.state = { ...this.state, ...overrides };
  }

  /** Publishes committed chain state to the app view (invalidates snapshots). */
  syncView(): void {
    this.view = this.cloneState();
    this.touch();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  // Contract transport ------------------------------------------------------

  /** Fails the *next* contract call, mimicking a wallet rejection. */
  rejectNextCall(error: unknown = rejectionError()): void {
    this.nextCallError = error;
  }

  /** Mines every pending transaction (optionally reverting the first one). */
  async mine(options: MineOptions = {}): Promise<RecordedTx[]> {
    const settled: RecordedTx[] = [];
    let firstTx = true;
    while (this.pending.length > 0) {
      const pending = this.pending[0];
      const revertReason = firstTx ? options.revertFirstTxWith : undefined;
      firstTx = false;

      if (revertReason !== undefined) {
        pending.fail(typeof revertReason === 'string' ? revertError(revertReason) : revertReason);
      } else {
        try {
          pending.apply();
          this.settleTx(pending);
        } catch (err) {
          pending.fail(err);
        }
      }

      const last = this.mined[this.mined.length - 1];
      if (last) settled.push(last);
    }
    this.syncView();
    return settled;
  }

  /** `ethers.Contract` compatible dispatcher used by the mocked ethers module. */
  call(contractAddress: string, method: string, args: unknown[]): Promise<TxResponse> {
    const contract = String(contractAddress).toLowerCase();
    const handler = CONTRACT_HANDLERS[`${contract}.${method}`];
    if (!handler) {
      return Promise.reject(
        new Error(`[chain-sim] ${method}() is not implemented for contract ${contractAddress}`)
      );
    }
    if (this.nextCallError) {
      const error = this.nextCallError;
      this.nextCallError = null;
      return Promise.reject(error);
    }
    return this.sendTx(contract, method, args, () => handler(this, args));
  }

  // Context snapshots (consumed by the mocked React contexts) ---------------

  getWalletSnapshot = (): WalletSnapshot => {
    if (!this.cachedWallet) {
      const address = this.address;
      this.cachedWallet = {
        isConnected: this.isConnected,
        address,
        signer: address
          ? {
              getAddress: async () => address,
            }
          : null,
        chainId: this.chainId,
        networkConfig: {
          chainId: this.chainId,
          name: NETWORK_NAME,
          addresses: { ...CHAIN, XenAddress: CHAIN.xenAddress },
        },
        networkWarning: this.networkWarning,
        connectWallet: async () => {
          this.connect();
        },
        disconnectWallet: async () => {
          this.disconnect();
        },
        switchNetwork: async (chainId: number) => {
          this.switchNetworkCalls.push(chainId);
          this.chainId = chainId;
          this.touch();
        },
        error: null,
        initError: null,
        isConnecting: false,
      };
    }
    return this.cachedWallet;
  };

  getProtocolSnapshot = (): ProtocolSnapshot => {
    if (!this.cachedProtocol) {
      const state = this.view ?? this.cloneState();
      this.cachedProtocol = {
        globalData: {
          effectiveSupply: e18(100_000_000),
          totalMinted: state.nxdMintedViaDeposit,
          totalNXDBurned: 0n,
          totalDXNBurned: 0n,
          totalDXNStaked: state.totalDXNStaked,
          totalETHSentToVault: e18(10),
          totalXENSentToVault: e18(1000),
          nxdMaxSupply: e18(100_000_000),
          burnedPercentage: 0,
          nxdMintedViaDeposit: state.nxdMintedViaDeposit,
          maxMintableDeposit: state.maxMintableDeposit,
          currentRate: state.currentRate,
          tierSize: state.tierSize,
          maxRewardsSupply: state.maxRewardsSupply,
          nxdTotalSupply: e18(1_000),
          totalVaultStaked: state.totalVaultStaked,
          emergencyWithdrawEnabled: state.emergencyWithdrawEnabled,
          xenVaultBalance: e18(100),
          totalETHToStakingVault: e18(10),
          totalXENBought: e18(1000),
          isLoaded: true,
        },
        userData: {
          dxnBalance: state.dxnBalance,
          dxnAllowance: state.dxnAllowance,
          nxdBalance: state.nxdBalance,
          nxdAllowance: state.nxdAllowance,
          stakedBalance: state.stakedBalance,
          pendingETH: state.pendingETH,
          pendingXEN: state.pendingXEN,
          cooldownRequest: state.cooldownRequest
            ? {
                amount: state.cooldownRequest.amount,
                releaseTime: state.cooldownRequest.releaseTime,
              }
            : null,
          isLoaded: true,
        },
        refreshAll: this.refreshAll,
        refreshGlobal: this.refreshAll,
        refreshUser: this.refreshAll,
        isLoadingGlobal: false,
        setIsLoadingGlobal: () => undefined,
      };
    }
    return this.cachedProtocol;
  };

  /** Mirrors `ProtocolContext.refreshAll`: RPC round-trip, then publish new data. */
  refreshAll = async (): Promise<void> => {
    this.refreshCalls += 1;
    await Promise.resolve();
    this.syncView();
  };

  // Internals ---------------------------------------------------------------

  private cloneState(): ChainState {
    return {
      ...this.state,
      cooldownRequest: this.state.cooldownRequest ? { ...this.state.cooldownRequest } : null,
    };
  }

  private touch(): void {
    this.version += 1;
    this.cachedProtocol = null;
    this.cachedWallet = null;
    this.listeners.forEach((listener) => listener());
  }

  private settleTx(pending: PendingTx): void {
    this.blockNumber += 1;
    pending.settle({ status: 1, blockNumber: this.blockNumber });
  }

  private sendTx(
    contract: string,
    method: string,
    args: unknown[],
    apply: () => void
  ): Promise<TxResponse> {
    this.txCounter += 1;
    const hash = `0x${this.txCounter.toString(16).padStart(64, '0')}`;

    let resolveWait!: (receipt: TxReceipt) => void;
    let rejectWait!: (error: unknown) => void;
    const waitPromise = new Promise<TxReceipt>((resolve, reject) => {
      resolveWait = resolve;
      rejectWait = reject;
    });
    // Avoid unhandled-rejection noise when a test never awaits `wait()`.
    void waitPromise.catch(() => undefined);

    const pending: PendingTx = {
      hash,
      contract,
      method,
      args,
      apply,
      settle: (receipt) => {
        this.pending = this.pending.filter((entry) => entry !== pending);
        this.mined.push({ hash, contract, method, args, receipt });
        resolveWait(receipt);
      },
      fail: (error) => {
        this.pending = this.pending.filter((entry) => entry !== pending);
        this.mined.push({ hash, contract, method, args, error });
        rejectWait(error);
      },
    };

    this.pending.push(pending);
    if (this.autoMine) {
      // Mimic a block time: mine the transaction on the next macrotask.
      setTimeout(() => {
        void this.mine();
      }, 0);
    }

    return Promise.resolve({ hash, wait: () => waitPromise });
  }
}

/** Process-wide simulated chain shared by every integration test file. */
export const chain = new ChainSimulator();

// -----------------------------------------------------------------------------
// Contract behaviour
// -----------------------------------------------------------------------------

type Handler = (sim: ChainSimulator, args: unknown[]) => void;

const asBigInt = (value: unknown): bigint =>
  typeof value === 'bigint' ? value : e18(typeof value === 'boolean' ? '0' : String(value ?? '0'));

const key = (address: string, fn: string) => `${address.toLowerCase()}.${fn}`;

/** ERC-20 `approve`; the address decides which allowance is written. */
const approveHandler =
  (field: 'dxnAllowance' | 'nxdAllowance'): Handler =>
  (sim, args) => {
    const amount = asBigInt(args[1]);
    if (amount <= 0n) throw revertError('ZeroAmount');
    sim.state[field] = amount;
  };

/** ERC-20 `transfer`. */
const transferHandler =
  (field: 'dxnBalance' | 'nxdBalance'): Handler =>
  (sim, args) => {
    const amount = asBigInt(args[1]);
    if (amount > sim.state[field]) throw revertError('ERC20InsufficientBalance');
    sim.state[field] -= amount;
  };

const CONTRACT_HANDLERS: Record<string, Handler> = {
  // DXNv2 (ERC-20 used to mint NXDv3)
  [key(CHAIN.dxnAddress, 'approve')]: approveHandler('dxnAllowance'),
  [key(CHAIN.dxnAddress, 'transfer')]: transferHandler('dxnBalance'),

  // NXDv3 (ERC-20 staked in the vault)
  [key(CHAIN.nxdAddress, 'approve')]: approveHandler('nxdAllowance'),
  [key(CHAIN.nxdAddress, 'transfer')]: transferHandler('nxdBalance'),

  // NXDv3Protocol
  [key(CHAIN.protocolAddress, 'deposit')]: (sim, args) => {
    const dxnIn = asBigInt(args[0]);
    if (dxnIn <= 0n) throw revertError('ZeroAmount');
    if (dxnIn > sim.state.dxnBalance) throw revertError('ERC20InsufficientBalance');
    if (dxnIn > sim.state.dxnAllowance) throw revertError('ERC20: insufficient allowance');
    const minted = (dxnIn * sim.state.currentRate) / ONE;
    sim.state.dxnBalance -= dxnIn;
    sim.state.dxnAllowance -= dxnIn;
    sim.state.nxdBalance += minted;
    sim.state.nxdMintedViaDeposit += minted;
  },
  [key(CHAIN.protocolAddress, 'depositNoMint')]: (sim, args) => {
    const dxnIn = asBigInt(args[0]);
    if (dxnIn <= 0n) throw revertError('ZeroAmount');
    if (dxnIn > sim.state.dxnBalance) throw revertError('ERC20InsufficientBalance');
    if (dxnIn > sim.state.dxnAllowance) throw revertError('ERC20: insufficient allowance');
    sim.state.dxnBalance -= dxnIn;
    sim.state.dxnAllowance -= dxnIn;
    sim.state.totalDXNStaked += dxnIn;
  },

  // NXDv3StakingVault
  [key(CHAIN.vaultAddress, 'deposit')]: (sim, args) => {
    const nxdIn = asBigInt(args[0]);
    if (nxdIn <= 0n) throw revertError('ZeroAmount');
    if (nxdIn > sim.state.nxdBalance) throw revertError('ERC20InsufficientBalance');
    if (nxdIn > sim.state.nxdAllowance) throw revertError('ERC20: insufficient allowance');
    sim.state.nxdBalance -= nxdIn;
    sim.state.nxdAllowance -= nxdIn;
    sim.state.stakedBalance += nxdIn;
    sim.state.totalVaultStaked += nxdIn;
  },
  [key(CHAIN.vaultAddress, 'withdraw')]: (sim, args) => {
    const amount = asBigInt(args[0]);
    const acceptsPenalty = Boolean(args[1]);
    const locked = sim.state.cooldownRequest ? sim.state.cooldownRequest.amount : 0n;
    if (amount > sim.state.stakedBalance - locked) {
      throw revertError('InsufficientStakedBalance');
    }
    if (acceptsPenalty) {
      const penalty = amount / 4n;
      sim.state.stakedBalance -= amount;
      sim.state.totalVaultStaked -= amount;
      sim.state.nxdBalance += amount - penalty;
    } else {
      sim.state.cooldownRequest = {
        amount,
        releaseTime: Math.floor(Date.now() / 1000) + COOLDOWN_SECONDS,
      };
    }
  },
  [key(CHAIN.vaultAddress, 'withdrawCooldown')]: (sim) => {
    const request = sim.state.cooldownRequest;
    if (!request) throw revertError('NoRequest');
    if (Math.floor(Date.now() / 1000) < request.releaseTime) throw revertError('Cooldown');
    sim.state.stakedBalance -= request.amount;
    sim.state.totalVaultStaked -= request.amount;
    sim.state.nxdBalance += request.amount;
    sim.state.cooldownRequest = null;
  },
  [key(CHAIN.vaultAddress, 'claimRewards')]: (sim) => {
    if (sim.state.pendingETH === 0n && sim.state.pendingXEN === 0n) {
      throw revertError('NothingToClaim');
    }
    sim.state.claimedETH += sim.state.pendingETH;
    sim.state.claimedXEN += sim.state.pendingXEN;
    sim.state.pendingETH = 0n;
    sim.state.pendingXEN = 0n;
  },
  [key(CHAIN.vaultAddress, 'claimRewardsTo')]: (sim) => {
    sim.state.claimedETH += sim.state.pendingETH;
    sim.state.claimedXEN += sim.state.pendingXEN;
    sim.state.pendingETH = 0n;
    sim.state.pendingXEN = 0n;
  },
  [key(CHAIN.vaultAddress, 'claimETH')]: (sim) => {
    sim.state.claimedETH += sim.state.pendingETH;
    sim.state.pendingETH = 0n;
  },
  [key(CHAIN.vaultAddress, 'claimETHTo')]: (sim) => {
    sim.state.claimedETH += sim.state.pendingETH;
    sim.state.pendingETH = 0n;
  },
  [key(CHAIN.vaultAddress, 'claimXEN')]: (sim) => {
    sim.state.claimedXEN += sim.state.pendingXEN;
    sim.state.pendingXEN = 0n;
  },
  [key(CHAIN.vaultAddress, 'claimXENTo')]: (sim) => {
    sim.state.claimedXEN += sim.state.pendingXEN;
    sim.state.pendingXEN = 0n;
  },
};

export interface TxResponse {
  hash: string;
  wait: () => Promise<TxReceipt>;
}

/** Shapes the failure like an ethers wallet denial (user pressed "Reject"). */
export const rejectionError = (reason = 'User rejected transaction'): unknown =>
  Object.assign(new Error(`transaction rejected: ${reason.toLowerCase()}`), {
    code: 'ACTION_REJECTED',
    reason,
    shortMessage: reason.toLowerCase(),
  });

/** Shapes the failure like an ethers CALL_EXCEPTION (solidity revert). */
export const revertError = (reason: string): unknown => {
  // Solidity custom errors are PascalCase identifiers; ethers exposes them as
  // `errorName`, which `contractErrors.ts` maps to user-facing copy.
  const isCustomErrorName = /^[A-Z][A-Za-z0-9_]*$/.test(reason);
  return Object.assign(new Error(`execution reverted: ${reason}`), {
    code: 'CALL_EXCEPTION',
    reason,
    shortMessage: `execution reverted: ${reason}`,
    ...(isCustomErrorName ? { errorName: reason } : {}),
  });
};
