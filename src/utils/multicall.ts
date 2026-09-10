/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from 'ethers';
import { executeWithRpcFailover, deduplicateRequest } from './rpcProvider';

const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';

const MULTICALL3_ABI = [
  'function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) public view returns (tuple(bool success, bytes returnData)[] returnData)',
  'function getEthBalance(address addr) public view returns (uint256 balance)',
];

const multicallInterface = new ethers.Interface(MULTICALL3_ABI);

export interface MulticallCall {
  target: string;
  allowFailure?: boolean;
  abi: readonly string[] | string[] | ethers.Interface;
  functionName: string;
  args?: any[];
}

interface MulticallResult {
  success: boolean;
  result: any;
}

// Global cache for ethers.Interface instances to minimize garbage collection & CPU overhead
const interfaceCache = new Map<any, ethers.Interface>();
const multicallCache = new Map<string, { timestamp: number; results: MulticallResult[] }>();
const CACHE_TTL_MS = 8000; // 8s result cache TTL to prevent rate-limiting (429) from redundant multicalls

function getCachedInterface(
  abi: readonly string[] | string[] | ethers.Interface
): ethers.Interface {
  if (abi instanceof ethers.Interface) return abi;
  let cached = interfaceCache.get(abi);
  if (!cached) {
    cached = new ethers.Interface(abi);
    interfaceCache.set(abi, cached);
  }
  return cached;
}

/**
 * Executes multiple contract calls in a SINGLE RPC request using Multicall3.
 * Supports contract function calls as well as native ETH balance queries.
 */
export async function multicall(
  calls: MulticallCall[],
  customProvider?: ethers.Provider,
  chainId: number = 10
): Promise<MulticallResult[]> {
  if (calls.length === 0) return [];

  // Format calls for Multicall3
  const formattedCalls = calls.map((call) => {
    let callData: string;
    let target = call.target;

    if (call.functionName === 'getEthBalance') {
      target = MULTICALL3_ADDRESS;
      callData = multicallInterface.encodeFunctionData('getEthBalance', [
        call.args?.[0] || call.target,
      ]);
    } else {
      const iface = getCachedInterface(call.abi);
      callData = iface.encodeFunctionData(call.functionName, call.args || []);
    }

    return {
      target,
      allowFailure: call.allowFailure ?? true,
      callData,
    };
  });

  const encodedCallData = multicallInterface.encodeFunctionData('aggregate3', [formattedCalls]);

  const executeCall = async (providerToUse: ethers.Provider): Promise<MulticallResult[]> => {
    const rawResult = await providerToUse.call({
      to: MULTICALL3_ADDRESS,
      data: encodedCallData,
    });

    const [decoded] = multicallInterface.decodeFunctionResult('aggregate3', rawResult);

    return decoded.map((res: { success: boolean; returnData: string }, index: number) => {
      const call = calls[index];
      if (!res.success || res.returnData === '0x' || !res.returnData) {
        return { success: false, result: null };
      }
      try {
        if (call.functionName === 'getEthBalance') {
          const [balance] = multicallInterface.decodeFunctionResult(
            'getEthBalance',
            res.returnData
          );
          return { success: true, result: balance };
        }

        const iface = getCachedInterface(call.abi);
        const decodedResult = iface.decodeFunctionResult(call.functionName, res.returnData);
        // If single return value, unwrap array
        const result = decodedResult.length === 1 ? decodedResult[0] : decodedResult;
        return { success: true, result };
      } catch (err) {
        console.warn(`Failed to decode result for ${call.functionName}:`, err);
        return { success: false, result: null };
      }
    });
  };

  if (customProvider) {
    return executeCall(customProvider);
  }

  const cacheKey = `multicall_${chainId}_${encodedCallData}_${calls.length}`;
  const now = Date.now();
  const cached = multicallCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.results;
  }

  // Deduplicate identical multicall requests that fire simultaneously
  const dedupKey = `multicall_${chainId}_${encodedCallData.slice(0, 100)}_${calls.length}`;
  const results = await deduplicateRequest(dedupKey, () =>
    executeWithRpcFailover((provider) => executeCall(provider), chainId)
  );

  multicallCache.set(cacheKey, { timestamp: Date.now(), results });
  return results;
}
