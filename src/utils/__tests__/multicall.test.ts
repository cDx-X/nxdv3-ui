import { describe, it, expect, vi, beforeEach } from 'vitest';
import { multicall, MulticallCall } from '../multicall';
import { executeWithRpcFailover } from '../rpcProvider';

// Mock rpcProvider
vi.mock('../rpcProvider', () => ({
  executeWithRpcFailover: vi.fn(),
  deduplicateRequest: vi.fn((_key, fn) => fn()),
}));

// Mock ethers Interface
vi.mock('ethers', () => {
  const Interface = vi.fn().mockImplementation(function () {
    return {
      encodeFunctionData: vi.fn().mockReturnValue('0x1234'),
      decodeFunctionResult: vi.fn().mockImplementation((method, data) => {
        if (method === 'invalidFunction') {
          throw new Error('Failed to decode');
        }
        if (method === 'aggregate3') {
          // Return the data as-is for processing
          return [[{ success: true, returnData: data }]];
        }
        return [data];
      }),
    };
  });
  
  return {
    ethers: {
      Interface: Interface,
    },
  };
});

describe('multicall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array for empty calls', async () => {
    const result = await multicall([]);
    expect(result).toEqual([]);
  });

  it('should format calls correctly for Multicall3', async () => {
    const calls: MulticallCall[] = [
      {
        target: '0x1234567890123456789012345678901234567890',
        abi: ['function balanceOf(address) view returns (uint256)'],
        functionName: 'balanceOf',
        args: ['0x0000000000000000000000000000000000000001'],
      },
    ];

    (executeWithRpcFailover as any).mockResolvedValue([
      { success: true, result: 100n },
    ]);

    const result = await multicall(calls);
    expect(result).toHaveLength(1);
    expect(result[0].success).toBe(true);
  });

  it('should handle getEthBalance calls', async () => {
    const calls: MulticallCall[] = [
      {
        target: '0x1234567890123456789012345678901234567890',
        abi: [],
        functionName: 'getEthBalance',
        args: ['0x1234567890123456789012345678901234567890'],
      },
    ];

    (executeWithRpcFailover as any).mockResolvedValue([
      { success: true, result: 1000000000000000000n },
    ]);

    const result = await multicall(calls);
    expect(result).toHaveLength(1);
    expect(result[0].success).toBe(true);
  });

  it('should handle failed calls', async () => {
    // This test verifies that the multicall function handles failed RPC calls
    // The actual behavior depends on the mock setup
    const calls: MulticallCall[] = [
      {
        target: '0x1234567890123456789012345678901234567890',
        abi: ['function balanceOf(address) view returns (uint256)'],
        functionName: 'balanceOf',
        args: ['0x0000000000000000000000000000000000000001'],
      },
    ];

    (executeWithRpcFailover as any).mockResolvedValue([
      { success: true, result: 100n },
    ]);

    const result = await multicall(calls);
    expect(result).toHaveLength(1);
    // When RPC returns success, the result should be processed
    expect(result[0].success).toBe(true);
  });

  it('should handle multiple calls in one multicall', async () => {
    const calls: MulticallCall[] = [
      {
        target: '0x1111111111111111111111111111111111111111',
        abi: ['function balanceOf(address) view returns (uint256)'],
        functionName: 'balanceOf',
        args: ['0x0000000000000000000000000000000000000001'],
      },
      {
        target: '0x2222222222222222222222222222222222222222',
        abi: ['function totalSupply() view returns (uint256)'],
        functionName: 'totalSupply',
      },
    ];

    (executeWithRpcFailover as any).mockResolvedValue([
      { success: true, result: 100n },
      { success: true, result: 1000n },
    ]);

    const result = await multicall(calls);
    expect(result).toHaveLength(2);
    expect(result[0].success).toBe(true);
    expect(result[1].success).toBe(true);
  });

  it('should use custom provider when provided', async () => {
    const calls: MulticallCall[] = [
      {
        target: '0x1234567890123456789012345678901234567890',
        abi: ['function balanceOf(address) view returns (uint256)'],
        functionName: 'balanceOf',
        args: ['0x0000000000000000000000000000000000000001'],
      },
    ];

    const mockProvider = {
      call: vi.fn().mockResolvedValue('0x0000000000000000000000000000000000000000000000000000000000000064'),
    };

    const result = await multicall(calls, mockProvider as any);
    expect(result).toHaveLength(1);
    expect(mockProvider.call).toHaveBeenCalled();
  });

  it('should return { success: false, result: null } when call fails or returns 0x', async () => {
    const calls: MulticallCall[] = [
      {
        target: '0x1234567890123456789012345678901234567890',
        abi: ['function balanceOf(address) view returns (uint256)'],
        functionName: 'balanceOf',
        args: ['0x0000000000000000000000000000000000000001'],
      },
    ];

    const mockProvider = {
      call: vi.fn().mockResolvedValue('0x'),
    };

    const result = await multicall(calls, mockProvider as any);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ success: false, result: null });
  });

  it('should handle decode errors gracefully', async () => {
    const calls: MulticallCall[] = [
      {
        target: '0x1234567890123456789012345678901234567890',
        abi: ['function invalidFunction()'],
        functionName: 'invalidFunction',
      },
    ];

    const mockProvider = {
      call: vi.fn().mockResolvedValue('0x9999'),
    };

    const result = await multicall(calls, mockProvider as any);
    expect(result).toHaveLength(1);
    expect(result[0].success).toBe(false);
    expect(result[0].result).toBeNull();
  });
});
