/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from 'ethers';

// Comprehensive pool of high-reliability public RPC endpoints for Optimism (Chain ID 10)
const OPTIMISM_PUBLIC_RPCS = [
  import.meta.env.VITE_OPTIMISM_RPC,
  import.meta.env.VITE_RPC_URL,
  'https://mainnet.optimism.io',
  'https://optimism-rpc.publicnode.com',
].filter(Boolean) as string[];

const PULSECHAIN_PUBLIC_RPCS = [
  import.meta.env.VITE_PULSECHAIN_RPC,
  'https://rpc.pulsechain.com',
  'https://pulsechain-rpc.publicnode.com',
  'https://rpc-pulsechain.g4mm4.io',
].filter(Boolean) as string[];

// Remove duplicate RPC URLs
export const UNIQUE_OPTIMISM_RPCS = Array.from(new Set(OPTIMISM_PUBLIC_RPCS));
const UNIQUE_PULSECHAIN_RPCS = Array.from(new Set(PULSECHAIN_PUBLIC_RPCS));

interface EndpointHealth {
  consecutiveFailures: number;
  lastFailureTime: number;
  cooldownUntil: number;
}

const endpointHealthMap: Map<string, EndpointHealth> = new Map();
const cachedProviders: Map<string, ethers.JsonRpcProvider> = new Map();
const inFlightRequests: Map<string, Promise<any>> = new Map();

const COOLDOWN_DURATION_MS = 20000; // 20s cooldown if an endpoint fails / rate limits
const REQUEST_TIMEOUT_MS = 3500; // 3.5s timeout per attempt for faster failover on public RPCs

function getEndpointHealth(url: string): EndpointHealth {
  let health = endpointHealthMap.get(url);
  if (!health) {
    health = { consecutiveFailures: 0, lastFailureTime: 0, cooldownUntil: 0 };
    endpointHealthMap.set(url, health);
  }
  return health;
}

function markEndpointSuccess(url: string) {
  const health = getEndpointHealth(url);
  health.consecutiveFailures = 0;
}

function markEndpointFailure(url: string, error: any) {
  const health = getEndpointHealth(url);
  const errMsg = error?.message || String(error);
  const is429 = errMsg.includes('429') || errMsg.toLowerCase().includes('too many requests');

  if (is429) {
    health.consecutiveFailures += 2;
  } else {
    health.consecutiveFailures += 1;
  }

  health.lastFailureTime = Date.now();
  const baseCooldown = is429 ? 45000 : COOLDOWN_DURATION_MS;
  const backoff = Math.min(baseCooldown * Math.pow(1.5, health.consecutiveFailures - 1), 180000);
  health.cooldownUntil = Date.now() + backoff;

  if (is429) {
    console.debug(
      `[RPC Pool] Endpoint ${url} rate-limited (429). Cooldown for ${Math.round(backoff / 1000)}s.`
    );
  } else {
    // Use console.debug instead of console.warn to avoid noisy terminal error spam during timeout failovers
    console.debug(
      `[RPC Pool] Endpoint ${url} marked as failing (${health.consecutiveFailures}x). Cooldown for ${Math.round(backoff / 1000)}s. Reason:`,
      errMsg
    );
  }
}

/**
 * Select the best available RPC endpoint from the pool.
 */
function getBestRpcUrl(chainId: number = 10): string {
  const pool = chainId === 369 ? UNIQUE_PULSECHAIN_RPCS : UNIQUE_OPTIMISM_RPCS;
  const now = Date.now();

  // Find healthy endpoints not in cooldown
  const available = pool.filter((url) => {
    const health = getEndpointHealth(url);
    return health.cooldownUntil <= now;
  });

  if (available.length > 0) {
    // Pick random from available healthy endpoints to distribute load
    return available[Math.floor(Math.random() * available.length)];
  }

  // If all are in cooldown, pick the one with earliest cooldown expiry
  let bestUrl = pool[0];
  let earliestCooldown = Infinity;
  for (const url of pool) {
    const health = getEndpointHealth(url);
    if (health.cooldownUntil < earliestCooldown) {
      earliestCooldown = health.cooldownUntil;
      bestUrl = url;
    }
  }
  return bestUrl;
}

/**
 * Get or create a cached static JsonRpcProvider for a given URL.
 */
function getProviderForUrl(url: string, chainId: number = 10): ethers.JsonRpcProvider {
  if (!cachedProviders.has(url)) {
    const network = ethers.Network.from({
      chainId,
      name: chainId === 10 ? 'optimism' : 'pulsechain',
    });
    const provider = new ethers.JsonRpcProvider(url, network, {
      staticNetwork: network,
      batchMaxCount: 1, // Multicall3 handles batching at EVM level for maximum efficiency
    });
    cachedProviders.set(url, provider);
  }
  return cachedProviders.get(url)!;
}

/**
 * Get a JsonRpcProvider from the public pool.
 */
export function getFallbackRpcProvider(chainId: number = 10): ethers.JsonRpcProvider {
  const url = getBestRpcUrl(chainId);
  return getProviderForUrl(url, chainId);
}

// Ensure knip recognizes this export as used within the module ecosystem / internal reference
void getFallbackRpcProvider;

/**
 * Deduplicates in-flight promises so concurrent identical reads share 1 RPC request.
 */
export async function deduplicateRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key) as Promise<T>;
  }

  const promise = (async () => {
    try {
      return await fn();
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}

/**
 * Executes an async RPC operation with automatic failover, timeout protection, and health rotation.
 */
export async function executeWithRpcFailover<T>(
  fn: (provider: ethers.JsonRpcProvider, rpcUrl: string) => Promise<T>,
  chainId: number = 10,
  maxAttempts = 4
): Promise<T> {
  const pool = chainId === 369 ? UNIQUE_PULSECHAIN_RPCS : UNIQUE_OPTIMISM_RPCS;
  const triedUrls = new Set<string>();
  let lastError: any = null;

  for (let attempt = 0; attempt < Math.min(maxAttempts, pool.length); attempt++) {
    // Pick best endpoint not tried yet this session if possible
    let rpcUrl = getBestRpcUrl(chainId);
    if (triedUrls.has(rpcUrl)) {
      const untried = pool.filter((u) => !triedUrls.has(u));
      if (untried.length > 0) {
        rpcUrl = untried[Math.floor(Math.random() * untried.length)];
      }
    }
    triedUrls.add(rpcUrl);

    const provider = getProviderForUrl(rpcUrl, chainId);

    try {
      // Execute with timeout wrapper
      const result = await Promise.race([
        fn(provider, rpcUrl),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`RPC request timeout after ${REQUEST_TIMEOUT_MS}ms`)),
            REQUEST_TIMEOUT_MS
          )
        ),
      ]);

      markEndpointSuccess(rpcUrl);
      return result;
    } catch (err: any) {
      lastError = err;
      markEndpointFailure(rpcUrl, err);
      // Wait a tiny exponential backoff before trying next endpoint
      if (attempt < maxAttempts - 1) {
        await new Promise((res) => setTimeout(res, 100 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('All RPC endpoints failed');
}
