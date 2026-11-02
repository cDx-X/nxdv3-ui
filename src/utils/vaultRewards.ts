/* eslint-disable @typescript-eslint/no-explicit-any */
import { NXDv3StakingVaultABI, CONTRACT_ADDRESSES } from '../abis/contracts';
import { multicall, MulticallCall } from './multicall';

const CACHE_KEY = 'nxdv3_vault_rewards_cache_v2';
const CACHE_TTL_MS = 60000; // 1 minute cache

export interface VaultRewardsDay {
  epoch: number;
  date: string; // 'YYYY-MM-DD' (UTC)
  startTime: number;
  ethWei: string;
  xenWei: string;
}

interface VaultRewardsCache {
  currentEpoch: number;
  daily: VaultRewardsDay[];
  updatedAt: number;
}

function loadCache(): VaultRewardsCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.updatedAt > CACHE_TTL_MS) {
      return null;
    }
    return parsed as VaultRewardsCache;
  } catch {
    return null;
  }
}

function saveCache(cache: VaultRewardsCache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore cache write error
  }
}

function toUtcDate(tsSec: number): string {
  if (!tsSec || tsSec <= 0) return 'N/A';
  const d = new Date(tsSec * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Fetches vault reward inflow history for all epochs in a SINGLE RPC call (Multicall3)
 * using NXDv3StakingVault.getAllEpochsInflowData().
 */
export async function fetchVaultRewards(forceFull = false): Promise<VaultRewardsDay[]> {
  if (!forceFull) {
    const cache = loadCache();
    if (cache && cache.daily.length > 0) {
      return cache.daily;
    }
  }

  const vAddr = CONTRACT_ADDRESSES.vaultAddress;

  const calls: MulticallCall[] = [
    { target: vAddr, abi: NXDv3StakingVaultABI, functionName: 'currentEpoch' },
    { target: vAddr, abi: NXDv3StakingVaultABI, functionName: 'contractStartTimestamp' },
    { target: vAddr, abi: NXDv3StakingVaultABI, functionName: 'getAllEpochsInflowData' },
  ];

  const res = await multicall(calls);

  const currEpoch = res[0]?.success ? Number(res[0].result || 0) : 0;
  const startTs = res[1]?.success ? Number(res[1].result || 0) : 0;
  const rawInflow = res[2]?.success && Array.isArray(res[2].result) ? res[2].result : [];

  const daily: VaultRewardsDay[] = [];

  if (rawInflow.length > 0) {
    rawInflow.forEach((item: any, idx: number) => {
      const ep = item?.epoch !== undefined ? Number(item.epoch) : Number(item[0] ?? idx);
      const startTime =
        item?.startTime !== undefined
          ? Number(item.startTime)
          : Number(item[1] ?? startTs + ep * 604800);
      const ethAmount =
        item?.ethAmount !== undefined ? BigInt(item.ethAmount) : BigInt(item[2] ?? 0);
      const xenAmount =
        item?.xenAmount !== undefined ? BigInt(item.xenAmount) : BigInt(item[3] ?? 0);

      daily.push({
        epoch: ep,
        date: toUtcDate(startTime),
        startTime,
        ethWei: ethAmount.toString(),
        xenWei: xenAmount.toString(),
      });
    });
  } else if (startTs > 0) {
    // Fallback if contract just initialized and array is empty
    daily.push({
      epoch: 0,
      date: toUtcDate(startTs),
      startTime: startTs,
      ethWei: '0',
      xenWei: '0',
    });
  }

  saveCache({ currentEpoch: currEpoch, daily, updatedAt: Date.now() });
  return daily;
}

/**
 * Fetches vault reward inflow history for a paginated epoch range (e.g. last 10 epochs)
 * using NXDv3StakingVault.getEpochsInflowData(fromEpoch, toEpoch).
 */
export async function fetchVaultRewardsPaginated(
  fromEpoch: number,
  toEpoch: number
): Promise<VaultRewardsDay[]> {
  const vAddr = CONTRACT_ADDRESSES.vaultAddress;

  const calls: MulticallCall[] = [
    {
      target: vAddr,
      abi: NXDv3StakingVaultABI,
      functionName: 'getEpochsInflowData',
      args: [fromEpoch, toEpoch],
    },
  ];

  const res = await multicall(calls);
  const rawInflow = res[0]?.success && Array.isArray(res[0].result) ? res[0].result : [];

  return rawInflow.map((item: any, idx: number) => {
    const ep = item?.epoch !== undefined ? Number(item.epoch) : Number(item[0] ?? fromEpoch + idx);
    const startTime = item?.startTime !== undefined ? Number(item.startTime) : Number(item[1] ?? 0);
    const ethAmount = item?.ethAmount !== undefined ? BigInt(item.ethAmount) : BigInt(item[2] ?? 0);
    const xenAmount = item?.xenAmount !== undefined ? BigInt(item.xenAmount) : BigInt(item[3] ?? 0);

    return {
      epoch: ep,
      date: toUtcDate(startTime),
      startTime,
      ethWei: ethAmount.toString(),
      xenWei: xenAmount.toString(),
    };
  });
}
