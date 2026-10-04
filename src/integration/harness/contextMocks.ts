import React from 'react';
import { ONE, chain, e18 } from './chainSim';

/**
 * `vi.mock` factories that wire the real application components to the
 * simulated chain (`chainSim.ts`).
 *
 * The factories are async on purpose: the harness modules are imported lazily by
 * the `vi.mock` factory, which keeps them out of the hoisted-mock binding order
 * problems that plain top-level constants would introduce.
 */

const USE_SYNC_EXTERNAL_STORE = React.useSyncExternalStore;

export const makeWalletContextMock = () => {
  const useWallet = () =>
    USE_SYNC_EXTERNAL_STORE(chain.subscribe, chain.getWalletSnapshot, chain.getWalletSnapshot);

  const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    React.createElement(React.Fragment, null, children);

  return {
    useWallet,
    WalletProvider,
    WalletContext: { Provider: WalletProvider },
  };
};

export const makeProtocolContextMock = () => {
  const useProtocol = () =>
    USE_SYNC_EXTERNAL_STORE(chain.subscribe, chain.getProtocolSnapshot, chain.getProtocolSnapshot);

  const ProtocolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    React.createElement(React.Fragment, null, children);

  return {
    useProtocol,
    ProtocolProvider,
    ProtocolContext: { Provider: ProtocolProvider },
  };
};

// -----------------------------------------------------------------------------
// ethers
// -----------------------------------------------------------------------------

const isAddress = (value: unknown): boolean =>
  typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value);

const parseEther = (value: string | number | bigint): bigint => {
  if (typeof value === 'bigint') return value;
  return e18(String(value));
};

const formatEther = (value: string | number | bigint | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  const wei = typeof value === 'bigint' ? value : BigInt(String(value));
  const negative = wei < 0n;
  const abs = negative ? -wei : wei;
  const whole = abs / ONE;
  const fraction = (abs % ONE).toString().padStart(18, '0').replace(/0+$/, '');
  const sign = negative ? '-' : '';
  return fraction ? `${sign}${whole}.${fraction}` : `${sign}${whole}`;
};

const formatUnits = (value: bigint, decimals: number): string => {
  const divisor = 10n ** BigInt(decimals);
  const whole = value / divisor;
  const fraction = (value % divisor).toString().padStart(decimals, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : `${whole}`;
};

/** Minimal stand-in for `new ethers.Contract(address, abi, signer)`. */
class SimulatedContract {
  readonly target: string;
  readonly abi: unknown;
  readonly runner: unknown;

  constructor(address: string, abi: unknown, runner?: unknown) {
    this.target = address;
    this.abi = abi;
    this.runner = runner;

    // Any method the ABIs expose is forwarded to the simulated chain, so the
    // component under test calls the very same API it would use in production.
    return new Proxy(this, {
      get: (t, prop) => {
        if (typeof prop === 'symbol') return undefined;
        if (prop in t) return Reflect.get(t, prop) as unknown;
        // Never look like a thenable, otherwise `await contract` would hang.
        if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined;
        return (...args: unknown[]) => chain.call(address, String(prop), args);
      },
    });
  }
}

export const makeEthersMock = () => ({
  ethers: {
    Contract: SimulatedContract,
    isAddress,
    parseEther,
    formatEther,
    formatUnits,
    parseUnits: (value: string, decimals: number): bigint => {
      const [whole, fraction = ''] = value.split('.');
      const padded = (fraction + '0'.repeat(decimals)).slice(0, decimals);
      return BigInt(`${whole}${padded}`);
    },
    Interface: class {
      encodeFunctionData = () => '0x';
      decodeFunctionResult = () => [0n];
    },
    ZeroAddress: '0x0000000000000000000000000000000000000000',
    getAddress: (address: string) => address,
    JsonRpcProvider: class {},
  },
  Wallet: class {},
});
