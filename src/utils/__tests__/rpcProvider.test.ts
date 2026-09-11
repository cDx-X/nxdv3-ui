import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ethers before importing
vi.mock('ethers', () => {
  const JsonRpcProvider = vi.fn().mockImplementation(function () {
    return {
      call: vi.fn().mockResolvedValue('0x'),
    };
  });
  const Network = {
    from: vi.fn().mockReturnValue({ chainId: 10, name: 'optimism' }),
  };
  return {
    ethers: {
      JsonRpcProvider,
      Network,
    },
  };
});

import { getFallbackRpcProvider, deduplicateRequest, executeWithRpcFailover } from '../rpcProvider';

describe('rpcProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFallbackRpcProvider', () => {
    it('should return a JsonRpcProvider', () => {
      const provider = getFallbackRpcProvider(10);
      expect(provider).toBeDefined();
    });

    it('should use PulseChain RPCs for chainId 369', () => {
      const provider = getFallbackRpcProvider(369);
      expect(provider).toBeDefined();
    });
  });

  describe('deduplicateRequest', () => {
    it('should deduplicate concurrent requests with same key', async () => {
      const fn = vi.fn().mockResolvedValue('result');
      
      const [result1, result2] = await Promise.all([
        deduplicateRequest('test-key', fn),
        deduplicateRequest('test-key', fn),
      ]);

      expect(result1).toBe('result');
      expect(result2).toBe('result');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not deduplicate requests with different keys', async () => {
      const fn1 = vi.fn().mockResolvedValue('result1');
      const fn2 = vi.fn().mockResolvedValue('result2');

      const [result1, result2] = await Promise.all([
        deduplicateRequest('key-1', fn1),
        deduplicateRequest('key-2', fn2),
      ]);

      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
    });

    it('should clean up in-flight requests after completion', async () => {
      const fn = vi.fn().mockResolvedValue('result');

      await deduplicateRequest('test-key', fn);
      
      // Second call should execute again since first is complete
      await deduplicateRequest('test-key', fn);
      
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('executeWithRpcFailover', () => {
    it('should execute function with RPC provider', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      
      const result = await executeWithRpcFailover(fn, 10, 1);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValueOnce('success');
      
      const result = await executeWithRpcFailover(fn, 10, 2);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('timeout'));
      
      await expect(executeWithRpcFailover(fn, 10, 2)).rejects.toThrow('timeout');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
