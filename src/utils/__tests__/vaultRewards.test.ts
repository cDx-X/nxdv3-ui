import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchVaultRewards,
  fetchVaultRewardsPaginated,
  VaultRewardsDay,
} from '../vaultRewards';
import { multicall } from '../multicall';

// Mock multicall
vi.mock('../multicall', () => ({
  multicall: vi.fn(),
}));

describe('vaultRewards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('fetchVaultRewards', () => {
    it('should return cached data if available and not forced', async () => {
      const cachedData: VaultRewardsDay[] = [
        {
          epoch: 0,
          date: '2024-01-01',
          startTime: 1704067200,
          ethWei: '1000000000000000000',
          xenWei: '0',
        },
      ];
      localStorage.setItem(
        'nxdv3_vault_rewards_cache_v2',
        JSON.stringify({
          currentEpoch: 1,
          daily: cachedData,
          updatedAt: Date.now(),
        })
      );

      const result = await fetchVaultRewards(false);
      expect(result).toEqual(cachedData);
      expect(multicall).not.toHaveBeenCalled();
    });

    it('should fetch from contract if cache is expired', async () => {
      const mockResult = [
        { success: true, result: 5n },
        { success: true, result: 1704067200n },
        {
          success: true,
          result: [
            { epoch: 0, startTime: 1704067200, ethAmount: 1000000000000000000n, xenAmount: 0n },
            { epoch: 1, startTime: 1704672000, ethAmount: 2000000000000000000n, xenAmount: 500000000000000000n },
          ],
        },
      ];
      (multicall as any).mockResolvedValue(mockResult);

      const result = await fetchVaultRewards(true);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        epoch: 0,
        date: '2024-01-01',
        startTime: 1704067200,
        ethWei: '1000000000000000000',
        xenWei: '0',
      });
      expect(result[1]).toEqual({
        epoch: 1,
        date: '2024-01-08',
        startTime: 1704672000,
        ethWei: '2000000000000000000',
        xenWei: '500000000000000000',
      });
    });

    it('should handle empty inflow data with fallback', async () => {
      const mockResult = [
        { success: true, result: 0n },
        { success: true, result: 1704067200n },
        { success: true, result: [] },
      ];
      (multicall as any).mockResolvedValue(mockResult);

      const result = await fetchVaultRewards(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        epoch: 0,
        date: '2024-01-01',
        startTime: 1704067200,
        ethWei: '0',
        xenWei: '0',
      });
    });

    it('should handle failed multicall results', async () => {
      const mockResult = [
        { success: false, result: null },
        { success: false, result: null },
        { success: false, result: null },
      ];
      (multicall as any).mockResolvedValue(mockResult);

      const result = await fetchVaultRewards(true);
      expect(result).toEqual([]);
    });

    it('should handle tuple array format', async () => {
      const mockResult = [
        { success: true, result: 2n },
        { success: true, result: 1704067200n },
        {
          success: true,
          result: [
            [0, 1704067200, 1000000000000000000n, 0n],
            [1, 1704672000, 2000000000000000000n, 500000000000000000n],
          ],
        },
      ];
      (multicall as any).mockResolvedValue(mockResult);

      const result = await fetchVaultRewards(true);
      expect(result).toHaveLength(2);
      expect(result[0].epoch).toBe(0);
      expect(result[1].epoch).toBe(1);
    });

    it('should cache results after fetching', async () => {
      const mockResult = [
        { success: true, result: 1n },
        { success: true, result: 1704067200n },
        {
          success: true,
          result: [
            { epoch: 0, startTime: 1704067200, ethAmount: 1000000000000000000n, xenAmount: 0n },
          ],
        },
      ];
      (multicall as any).mockResolvedValue(mockResult);

      await fetchVaultRewards(true);

      const cached = localStorage.getItem('nxdv3_vault_rewards_cache_v2');
      expect(cached).toBeTruthy();
      const parsed = JSON.parse(cached!);
      expect(parsed.currentEpoch).toBe(1);
      expect(parsed.daily).toHaveLength(1);
    });
  });

  describe('fetchVaultRewardsPaginated', () => {
    it('should fetch paginated data for epoch range', async () => {
      const mockResult = [
        {
          success: true,
          result: [
            { epoch: 5, startTime: 1706486400, ethAmount: 1000000000000000000n, xenAmount: 0n },
            { epoch: 6, startTime: 1707091200, ethAmount: 2000000000000000000n, xenAmount: 500000000000000000n },
          ],
        },
      ];
      (multicall as any).mockResolvedValue(mockResult);

      const result = await fetchVaultRewardsPaginated(5, 6);
      expect(result).toHaveLength(2);
      expect(result[0].epoch).toBe(5);
      expect(result[1].epoch).toBe(6);
    });

    it('should return empty array on failure', async () => {
      const mockResult = [{ success: false, result: null }];
      (multicall as any).mockResolvedValue(mockResult);

      const result = await fetchVaultRewardsPaginated(0, 10);
      expect(result).toEqual([]);
    });

    it('should handle tuple format in paginated data', async () => {
      const mockResult = [
        {
          success: true,
          result: [
            [5, 1706486400, 1000000000000000000n, 0n],
            [6, 1707091200, 2000000000000000000n, 500000000000000000n],
          ],
        },
      ];
      (multicall as any).mockResolvedValue(mockResult);

      const result = await fetchVaultRewardsPaginated(5, 6);
      expect(result).toHaveLength(2);
      expect(result[0].epoch).toBe(5);
    });
  });
});
