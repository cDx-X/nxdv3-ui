import React, { createContext, useContext, useCallback, useRef, useEffect, useState } from 'react';
import { useWallet } from './WalletContext';
import { multicall, MulticallCall } from '../utils/multicall';
import {
  NXDv3ProtocolABI,
  NXDv3ERC20ABI,
  NXDv3StakingVaultABI,
  opXenERC20ABI,
  CONTRACT_ADDRESSES,
} from '../abis/contracts';

interface GlobalProtocolState {
  // 9 Core Metrics
  effectiveSupply: bigint; // 1. NXDv3ERC20.effectiveMaxSupply()
  totalMinted: bigint; // 2. NXDv3ERC20.totalMinted()
  totalNXDBurned: bigint; // 3. NXDv3ERC20.totalNXDBurned()
  totalDXNBurned: bigint; // 4. NXDv3Protocol.totalDXNBurned()
  totalDXNStaked: bigint; // 5. NXDv3Protocol.totalDXNStaked()
  totalETHSentToVault: bigint; // 6. NXDv3StakingVault.cumulativeRewardsSinceStart()
  totalXENSentToVault: bigint; // 7. NXDv3StakingVault.cumulativeXenRewardsSinceStart()
  nxdMaxSupply: bigint; // 8. NXDv3ERC20.maxSupply()
  burnedPercentage: number; // 9. Frontend calculation (totalNXDBurned / maxSupply) * 100

  // Additional protocol fields
  nxdMintedViaDeposit: bigint;
  maxMintableDeposit: bigint;
  currentRate: bigint;
  tierSize: bigint;
  maxRewardsSupply: bigint;
  nxdTotalSupply: bigint;
  totalVaultStaked: bigint;
  emergencyWithdrawEnabled: boolean;
  xenVaultBalance: bigint;

  // Backwards compatibility aliases
  totalETHToStakingVault: bigint;
  totalXENBought: bigint;
  isLoaded: boolean;
}

interface UserProtocolState {
  dxnBalance: bigint;
  dxnAllowance: bigint;
  nxdBalance: bigint;
  nxdAllowance: bigint;
  stakedBalance: bigint;
  pendingETH: bigint;
  pendingXEN: bigint;
  cooldownRequest: { amount: bigint; releaseTime: number } | null;
  isLoaded: boolean;
}

const STORAGE_GLOBAL_KEY = 'nxdv3_cached_global_state_v2';
const STORAGE_USER_PREFIX = 'nxdv3_cached_user_state_v2_';

// Global protocol metrics change slowly (minutes), so we cache them much longer
// than the per-user data. This drastically cuts redundant RPC traffic.
const GLOBAL_CACHE_TTL_MS = 180000; // 3 minutes
const USER_CACHE_TTL_MS = 45000; // 45 seconds

const initialGlobalState: GlobalProtocolState = {
  effectiveSupply: 0n,
  totalMinted: 0n,
  totalNXDBurned: 0n,
  totalDXNBurned: 0n,
  totalDXNStaked: 0n,
  totalETHSentToVault: 0n,
  totalXENSentToVault: 0n,
  nxdMaxSupply: 0n,
  burnedPercentage: 0,
  nxdMintedViaDeposit: 0n,
  maxMintableDeposit: 0n,
  currentRate: 0n,
  tierSize: 0n,
  maxRewardsSupply: 0n,
  nxdTotalSupply: 0n,
  totalVaultStaked: 0n,
  emergencyWithdrawEnabled: false,
  xenVaultBalance: 0n,
  totalETHToStakingVault: 0n,
  totalXENBought: 0n,
  isLoaded: false,
};

const initialUserState: UserProtocolState = {
  dxnBalance: 0n,
  dxnAllowance: 0n,
  nxdBalance: 0n,
  nxdAllowance: 0n,
  stakedBalance: 0n,
  pendingETH: 0n,
  pendingXEN: 0n,
  cooldownRequest: null,
  isLoaded: false,
};

function getSavedGlobalState(): GlobalProtocolState {
  try {
    const raw = localStorage.getItem(STORAGE_GLOBAL_KEY);
    if (!raw) return initialGlobalState;
    const parsed = JSON.parse(raw);
    return {
      effectiveSupply: BigInt(parsed.effectiveSupply || '0'),
      totalMinted: BigInt(parsed.totalMinted || '0'),
      totalNXDBurned: BigInt(parsed.totalNXDBurned || '0'),
      totalDXNBurned: BigInt(parsed.totalDXNBurned || '0'),
      totalDXNStaked: BigInt(parsed.totalDXNStaked || '0'),
      totalETHSentToVault: BigInt(parsed.totalETHSentToVault || parsed.totalETHToStakingVault || '0'),
      totalXENSentToVault: BigInt(parsed.totalXENSentToVault || parsed.totalXENBought || '0'),
      nxdMaxSupply: BigInt(parsed.nxdMaxSupply || '0'),
      burnedPercentage: Number(parsed.burnedPercentage || 0),
      nxdMintedViaDeposit: BigInt(parsed.nxdMintedViaDeposit || '0'),
      maxMintableDeposit: BigInt(parsed.maxMintableDeposit || '0'),
      currentRate: BigInt(parsed.currentRate || '0'),
      tierSize: BigInt(parsed.tierSize || '0'),
      maxRewardsSupply: BigInt(parsed.maxRewardsSupply || '0'),
      nxdTotalSupply: BigInt(parsed.nxdTotalSupply || '0'),
      totalVaultStaked: BigInt(parsed.totalVaultStaked || '0'),
      emergencyWithdrawEnabled: Boolean(parsed.emergencyWithdrawEnabled),
      xenVaultBalance: BigInt(parsed.xenVaultBalance || '0'),
      totalETHToStakingVault: BigInt(parsed.totalETHSentToVault || parsed.totalETHToStakingVault || '0'),
      totalXENBought: BigInt(parsed.totalXENSentToVault || parsed.totalXENBought || '0'),
      isLoaded: true,
    };
  } catch {
    return initialGlobalState;
  }
}

function saveGlobalState(state: GlobalProtocolState) {
  try {
    const serialized = {
      effectiveSupply: state.effectiveSupply.toString(),
      totalMinted: state.totalMinted.toString(),
      totalNXDBurned: state.totalNXDBurned.toString(),
      totalDXNBurned: state.totalDXNBurned.toString(),
      totalDXNStaked: state.totalDXNStaked.toString(),
      totalETHSentToVault: state.totalETHSentToVault.toString(),
      totalXENSentToVault: state.totalXENSentToVault.toString(),
      nxdMaxSupply: state.nxdMaxSupply.toString(),
      burnedPercentage: state.burnedPercentage,
      nxdMintedViaDeposit: state.nxdMintedViaDeposit.toString(),
      maxMintableDeposit: state.maxMintableDeposit.toString(),
      currentRate: state.currentRate.toString(),
      tierSize: state.tierSize.toString(),
      maxRewardsSupply: state.maxRewardsSupply.toString(),
      nxdTotalSupply: state.nxdTotalSupply.toString(),
      totalVaultStaked: state.totalVaultStaked.toString(),
      emergencyWithdrawEnabled: state.emergencyWithdrawEnabled,
      xenVaultBalance: state.xenVaultBalance.toString(),
      totalETHToStakingVault: state.totalETHSentToVault.toString(),
      totalXENBought: state.totalXENSentToVault.toString(),
    };
    localStorage.setItem(STORAGE_GLOBAL_KEY, JSON.stringify(serialized));
  } catch {
    // Ignore cache write error
  }
}

function getSavedUserState(address: string): UserProtocolState {
  try {
    const raw = localStorage.getItem(`${STORAGE_USER_PREFIX}${address.toLowerCase()}`);
    if (!raw) return initialUserState;
    const parsed = JSON.parse(raw);
    return {
      dxnBalance: BigInt(parsed.dxnBalance || '0'),
      dxnAllowance: BigInt(parsed.dxnAllowance || '0'),
      nxdBalance: BigInt(parsed.nxdBalance || '0'),
      nxdAllowance: BigInt(parsed.nxdAllowance || '0'),
      stakedBalance: BigInt(parsed.stakedBalance || '0'),
      pendingETH: BigInt(parsed.pendingETH || '0'),
      pendingXEN: BigInt(parsed.pendingXEN || '0'),
      cooldownRequest: parsed.cooldownRequest
        ? {
            amount: BigInt(parsed.cooldownRequest.amount || '0'),
            releaseTime: Number(parsed.cooldownRequest.releaseTime || 0),
          }
        : null,
      isLoaded: true,
    };
  } catch {
    return initialUserState;
  }
}

function saveUserState(address: string, state: UserProtocolState) {
  try {
    const serialized = {
      dxnBalance: state.dxnBalance.toString(),
      dxnAllowance: state.dxnAllowance.toString(),
      nxdBalance: state.nxdBalance.toString(),
      nxdAllowance: state.nxdAllowance.toString(),
      stakedBalance: state.stakedBalance.toString(),
      pendingETH: state.pendingETH.toString(),
      pendingXEN: state.pendingXEN.toString(),
      cooldownRequest: state.cooldownRequest
        ? {
            amount: state.cooldownRequest.amount.toString(),
            releaseTime: state.cooldownRequest.releaseTime,
          }
        : null,
    };
    localStorage.setItem(
      `${STORAGE_USER_PREFIX}${address.toLowerCase()}`,
      JSON.stringify(serialized)
    );
  } catch {
    // Ignore cache write error
  }
}

interface ProtocolContextType {
  globalData: GlobalProtocolState;
  userData: UserProtocolState;
  refreshAll: (force?: boolean | React.MouseEvent) => Promise<void>;
  refreshGlobal: (force?: boolean) => Promise<void>;
  refreshUser: (force?: boolean) => Promise<void>;
  isLoadingGlobal: boolean;
  setIsLoadingGlobal: (loading: boolean) => void;
}

const ProtocolContext = createContext<ProtocolContextType | undefined>(undefined);

export const ProtocolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address, isConnected } = useWallet();
  const [globalData, setGlobalData] = useState<GlobalProtocolState>(getSavedGlobalState);
  const [userData, setUserData] = useState<UserProtocolState>(() =>
    address ? getSavedUserState(address) : initialUserState
  );
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);

  const isFetchingRef = useRef(false);
  const lastGlobalFetchRef = useRef(0);
  const lastUserFetchRef = useRef(0);
  const prevAddressRef = useRef(address);

  // Refs mirror the latest state so the fetch callbacks stay stable (no stale
  // closures / no re-creation when state changes).
  const globalDataRef = useRef(globalData);
  useEffect(() => {
    globalDataRef.current = globalData;
  }, [globalData]);
  const userDataRef = useRef(userData);
  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  // ---- Global data (Single Multicall3 batch, cached 3 min) -----------------
  const refreshGlobal = useCallback(async (force: boolean = false) => {
    const now = Date.now();
    if (isFetchingRef.current) return;
    if (
      !force &&
      globalDataRef.current.isLoaded &&
      now - lastGlobalFetchRef.current < GLOBAL_CACHE_TTL_MS
    ) {
      return;
    }
    isFetchingRef.current = true;
    setIsLoadingGlobal(true);
    lastGlobalFetchRef.current = now;

    try {
      const pAddr = CONTRACT_ADDRESSES.protocolAddress;
      const vAddr = CONTRACT_ADDRESSES.vaultAddress;
      const nxdAddr = CONTRACT_ADDRESSES.nxdAddress;
      const xenAddr = CONTRACT_ADDRESSES.XenAddress;

      // Single Multicall3 query containing all 9 core metrics + protocol state
      const globalCalls: MulticallCall[] = [
        // [0] 1. Effective Supply: NXDv3ERC20.effectiveMaxSupply()
        { target: nxdAddr, abi: NXDv3ERC20ABI, functionName: 'effectiveMaxSupply' },
        // [1] 2. Total NXD Mined (Minted): NXDv3ERC20.totalMinted()
        { target: nxdAddr, abi: NXDv3ERC20ABI, functionName: 'totalMinted' },
        // [2] 3. Total NXD Burned: NXDv3ERC20.totalNXDBurned()
        { target: nxdAddr, abi: NXDv3ERC20ABI, functionName: 'totalNXDBurned' },
        // [3] 4. Total DXN Burned: NXDv3Protocol.totalDXNBurned()
        { target: pAddr, abi: NXDv3ProtocolABI, functionName: 'totalDXNBurned' },
        // [4] 5. Total DXN Staked: NXDv3Protocol.totalDXNStaked()
        { target: pAddr, abi: NXDv3ProtocolABI, functionName: 'totalDXNStaked' },
        // [5] 6. Total ETH Sent to Vault: NXDv3StakingVault.cumulativeRewardsSinceStart()
        { target: vAddr, abi: NXDv3StakingVaultABI, functionName: 'cumulativeRewardsSinceStart' },
        // [6] 7. Total XEN Sent to Vault: NXDv3StakingVault.cumulativeXenRewardsSinceStart()
        { target: vAddr, abi: NXDv3StakingVaultABI, functionName: 'cumulativeXenRewardsSinceStart' },
        // [7] 8. Max Supply: NXDv3ERC20.maxSupply()
        { target: nxdAddr, abi: NXDv3ERC20ABI, functionName: 'maxSupply' },
        // [8] NXDv3Protocol.nxdMintedViaDeposit()
        { target: pAddr, abi: NXDv3ProtocolABI, functionName: 'nxdMintedViaDeposit' },
        // [9] NXDv3Protocol.MINTABLE_SUPPLY_FOR_DEPOSIT()
        { target: pAddr, abi: NXDv3ProtocolABI, functionName: 'MINTABLE_SUPPLY_FOR_DEPOSIT' },
        // [10] NXDv3Protocol.currentRate()
        { target: pAddr, abi: NXDv3ProtocolABI, functionName: 'currentRate' },
        // [11] NXDv3Protocol.TIER_SIZE()
        { target: pAddr, abi: NXDv3ProtocolABI, functionName: 'TIER_SIZE' },
        // [12] NXDv3Protocol.MAX_REWARDS_SUPPLY()
        { target: pAddr, abi: NXDv3ProtocolABI, functionName: 'MAX_REWARDS_SUPPLY' },
        // [13] NXDv3ERC20.totalSupply()
        { target: nxdAddr, abi: NXDv3ERC20ABI, functionName: 'totalSupply' },
        // [14] NXDv3StakingVault.totalStaked()
        { target: vAddr, abi: NXDv3StakingVaultABI, functionName: 'totalStaked' },
        // [15] NXDv3StakingVault.emergencyWithdrawEnabled()
        { target: vAddr, abi: NXDv3StakingVaultABI, functionName: 'emergencyWithdrawEnabled' },
        // [16] opXenERC20.balanceOf(vAddr)
        { target: xenAddr, abi: opXenERC20ABI, functionName: 'balanceOf', args: [vAddr] },
      ];

      const gRes = await multicall(globalCalls);

      const totalNXDBurned = gRes[2]?.success
        ? BigInt(gRes[2].result || 0)
        : globalDataRef.current.totalNXDBurned;
      const nxdMaxSupply = gRes[7]?.success
        ? BigInt(gRes[7].result || 0)
        : globalDataRef.current.nxdMaxSupply;

      // 9. % NXD Burned vs Max Supply (Frontend calculation)
      const burnedPercentage =
        nxdMaxSupply > 0n
          ? Number((totalNXDBurned * 1000000n) / nxdMaxSupply) / 10000
          : 0;

      const effectiveSupplyVal = gRes[0]?.success
        ? BigInt(gRes[0].result || 0)
        : nxdMaxSupply > totalNXDBurned
          ? nxdMaxSupply - totalNXDBurned
          : globalDataRef.current.effectiveSupply;

      const totalETHSent = gRes[5]?.success
        ? BigInt(gRes[5].result || 0)
        : globalDataRef.current.totalETHSentToVault;

      const totalXENSent = gRes[6]?.success
        ? BigInt(gRes[6].result || 0)
        : globalDataRef.current.totalXENSentToVault;

      const newGlobalState: GlobalProtocolState = {
        effectiveSupply: effectiveSupplyVal,
        totalMinted: gRes[1]?.success
          ? BigInt(gRes[1].result || 0)
          : globalDataRef.current.totalMinted,
        totalNXDBurned,
        totalDXNBurned: gRes[3]?.success
          ? BigInt(gRes[3].result || 0)
          : globalDataRef.current.totalDXNBurned,
        totalDXNStaked: gRes[4]?.success
          ? BigInt(gRes[4].result || 0)
          : globalDataRef.current.totalDXNStaked,
        totalETHSentToVault: totalETHSent,
        totalXENSentToVault: totalXENSent,
        nxdMaxSupply,
        burnedPercentage,

        nxdMintedViaDeposit: gRes[8]?.success
          ? BigInt(gRes[8].result || 0)
          : globalDataRef.current.nxdMintedViaDeposit,
        maxMintableDeposit: gRes[9]?.success
          ? BigInt(gRes[9].result || 0)
          : globalDataRef.current.maxMintableDeposit || 0n,
        currentRate: gRes[10]?.success
          ? BigInt(gRes[10].result || 0)
          : globalDataRef.current.currentRate,
        tierSize: gRes[11]?.success
          ? BigInt(gRes[11].result || 0)
          : globalDataRef.current.tierSize || 0n,
        maxRewardsSupply: gRes[12]?.success
          ? BigInt(gRes[12].result || 0)
          : globalDataRef.current.maxRewardsSupply || 0n,
        nxdTotalSupply: gRes[13]?.success
          ? BigInt(gRes[13].result || 0)
          : globalDataRef.current.nxdTotalSupply,
        totalVaultStaked: gRes[14]?.success
          ? BigInt(gRes[14].result || 0)
          : globalDataRef.current.totalVaultStaked,
        emergencyWithdrawEnabled: gRes[15]?.success
          ? Boolean(gRes[15].result)
          : globalDataRef.current.emergencyWithdrawEnabled,
        xenVaultBalance: gRes[16]?.success
          ? BigInt(gRes[16].result || 0)
          : globalDataRef.current.xenVaultBalance,

        totalETHToStakingVault: totalETHSent,
        totalXENBought: totalXENSent,
        isLoaded: true,
      };

      setGlobalData(newGlobalState);
      saveGlobalState(newGlobalState);
    } catch (err) {
      console.error('[ProtocolContext] Global multicall error:', err);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingGlobal(false);
    }
  }, []);

  // ---- User data (8 calls, single pool, cached 45s) ------------------------
  const refreshUser = useCallback(
    async (force: boolean = false) => {
      const now = Date.now();
      if (isFetchingRef.current) return;
      if (!address) {
        setUserData(initialUserState);
        return;
      }
      if (
        !force &&
        userDataRef.current.isLoaded &&
        now - lastUserFetchRef.current < USER_CACHE_TTL_MS
      ) {
        return;
      }
      isFetchingRef.current = true;
      setIsLoadingGlobal(true);
      lastUserFetchRef.current = now;

      try {
        const pAddr = CONTRACT_ADDRESSES.protocolAddress;
        const vAddr = CONTRACT_ADDRESSES.vaultAddress;
        const nxdAddr = CONTRACT_ADDRESSES.nxdAddress;
        const dxnAddr = CONTRACT_ADDRESSES.dxnAddress;

        // Vault is single pool: functions take [address] directly (no pid)
        const userCalls: MulticallCall[] = [
          { target: dxnAddr, abi: NXDv3ERC20ABI, functionName: 'balanceOf', args: [address] },
          {
            target: dxnAddr,
            abi: NXDv3ERC20ABI,
            functionName: 'allowance',
            args: [address, pAddr],
          },
          { target: nxdAddr, abi: NXDv3ERC20ABI, functionName: 'balanceOf', args: [address] },
          {
            target: nxdAddr,
            abi: NXDv3ERC20ABI,
            functionName: 'allowance',
            args: [address, vAddr],
          },
          {
            target: vAddr,
            abi: NXDv3StakingVaultABI,
            functionName: 'userInfo',
            args: [address],
          },
          {
            target: vAddr,
            abi: NXDv3StakingVaultABI,
            functionName: 'pendingETH',
            args: [address],
          },
          {
            target: vAddr,
            abi: NXDv3StakingVaultABI,
            functionName: 'pendingXEN',
            args: [address],
          },
          {
            target: vAddr,
            abi: NXDv3StakingVaultABI,
            functionName: 'withdrawalRequests',
            args: [address],
          },
        ];

        const uRes = await multicall(userCalls);

        const userInfo = uRes[4]?.success ? uRes[4].result : null;
        const cooldown = uRes[7]?.success ? uRes[7].result : null;
        const stakedVal =
          userInfo?.amount !== undefined
            ? BigInt(userInfo.amount)
            : Array.isArray(userInfo)
              ? BigInt(userInfo[0] || 0)
              : 0n;
        const cdAmount =
          cooldown?.amount !== undefined
            ? BigInt(cooldown.amount)
            : Array.isArray(cooldown)
              ? BigInt(cooldown[0] || 0)
              : 0n;
        const cdRelease =
          cooldown?.canWithdrawAfterTimestamp !== undefined
            ? Number(cooldown.canWithdrawAfterTimestamp)
            : Array.isArray(cooldown)
              ? Number(cooldown[1] || 0)
              : 0;

        const newUserState: UserProtocolState = {
          dxnBalance: uRes[0]?.success ? BigInt(uRes[0].result || 0) : 0n,
          dxnAllowance: uRes[1]?.success ? BigInt(uRes[1].result || 0) : 0n,
          nxdBalance: uRes[2]?.success ? BigInt(uRes[2].result || 0) : 0n,
          nxdAllowance: uRes[3]?.success ? BigInt(uRes[3].result || 0) : 0n,
          stakedBalance: stakedVal,
          pendingETH: uRes[5]?.success ? BigInt(uRes[5].result || 0) : 0n,
          pendingXEN: uRes[6]?.success ? BigInt(uRes[6].result || 0) : 0n,
          cooldownRequest: cdAmount > 0n ? { amount: cdAmount, releaseTime: cdRelease } : null,
          isLoaded: true,
        };

        setUserData(newUserState);
        saveUserState(address, newUserState);
      } catch (err) {
        console.error('[ProtocolContext] User multicall error:', err);
      } finally {
        isFetchingRef.current = false;
        setIsLoadingGlobal(false);
      }
    },
    [address]
  );

  // ---- Full refresh (both) --------------------------------------------------
  const refreshAll = useCallback(
    async (force: boolean | React.MouseEvent = false) => {
      const isForce = typeof force === 'boolean' ? force : true;
      await refreshGlobal(isForce);
      await refreshUser(isForce);
    },
    [refreshGlobal, refreshUser]
  );

  useEffect(() => {
    if (address) {
      setUserData(getSavedUserState(address));
      if (
        !prevAddressRef.current ||
        prevAddressRef.current.toLowerCase() !== address.toLowerCase()
      ) {
        lastUserFetchRef.current = 0;
        isFetchingRef.current = false;
        refreshAll(true);
      }
    } else {
      setUserData(initialUserState);
    }
    prevAddressRef.current = address;
  }, [address, refreshAll]);

  // Background sync: full refresh on mount + 3h interval; user-only refresh on
  // focus/visibility (global data changes too slowly to re-fetch on tab switch).
  useEffect(() => {
    refreshAll();

    let debounceTimeout: NodeJS.Timeout | null = null;
    const debouncedRefresh = () => {
      if (document.hidden) return;
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        refreshUser();
      }, 800);
    };

    document.addEventListener('visibilitychange', debouncedRefresh);
    window.addEventListener('focus', debouncedRefresh);

    const interval = setInterval(
      () => {
        if (!document.hidden) {
          refreshAll();
        }
      },
      3 * 60 * 60 * 1000
    );

    return () => {
      clearInterval(interval);
      if (debounceTimeout) clearTimeout(debounceTimeout);
      document.removeEventListener('visibilitychange', debouncedRefresh);
      window.removeEventListener('focus', debouncedRefresh);
    };
  }, [isConnected, refreshAll, refreshUser]);

  return (
    <ProtocolContext.Provider
      value={{
        globalData,
        userData,
        refreshAll,
        refreshGlobal,
        refreshUser,
        isLoadingGlobal,
        setIsLoadingGlobal,
      }}
    >
      {children}
    </ProtocolContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useProtocol = () => {
  const context = useContext(ProtocolContext);
  if (!context) {
    throw new Error('useProtocol must be used within a ProtocolProvider');
  }
  return context;
};
