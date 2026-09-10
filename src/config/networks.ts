import { UNIQUE_OPTIMISM_RPCS } from '../utils/rpcProvider';

export interface NetworkConfig {
  chainId: number;
  chainIdHex: string;
  name: string;
  rpcUrl: string;
  rpcUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer: string;
  addresses: {
    protocolAddress: string;
    vaultAddress: string;
    nxdAddress: string;
    taxRecipientAddress: string;
    XenAddress: string;
    dxnAddress: string;
    DBXenAddress: string;
    iDBXenViews: string;
  };
}

export const NETWORKS: Record<number, NetworkConfig> = {
  10: {
    chainId: 10,
    chainIdHex: '0xa',
    name: 'Optimism',
    rpcUrl: UNIQUE_OPTIMISM_RPCS[0] || 'https://mainnet.optimism.io',
    rpcUrls: UNIQUE_OPTIMISM_RPCS,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://optimistic.etherscan.io',
    addresses: {
      protocolAddress: '0x8C6f6ec2281D5678844556887DEDa5cEC907De87',
      vaultAddress: '0x5B65373fbC6485338C4cd57D4823AB5901Cc14C1',
      nxdAddress: '0x3d1758d8b7f47b0922A1e9b19465259092F28486',
      taxRecipientAddress: '0x8ae6A0Ab65cE133365760F11367d5353BBcf5f40',
      XenAddress: '0xeB585163DEbB1E637c6D617de3bEF99347cd75c8',
      dxnAddress: '0x90386DA49028ef1eF18F47f0a740cAAB50782576',
      DBXenAddress: '0x95202A555171458dA4a48be3b4C290eF832e38b2',
      iDBXenViews: '0x928766B9437fFDD515fe7AcCC7ce74e7A78C0411',
    },
  },
  369: {
    chainId: 369,
    chainIdHex: '0x171',
    name: 'PulseChain',
    rpcUrl: import.meta.env.VITE_PULSECHAIN_RPC || 'https://rpc.pulsechain.com',
    rpcUrls: [import.meta.env.VITE_PULSECHAIN_RPC || 'https://rpc.pulsechain.com'],
    nativeCurrency: { name: 'Pulse', symbol: 'PLS', decimals: 18 },
    blockExplorer: 'https://scan.pulsechain.com',
    addresses: {
      protocolAddress: '', // Placeholder - configured when deployed on PulseChain
      vaultAddress: '',
      nxdAddress: '',
      taxRecipientAddress: '',
      XenAddress: '0x8a7FDcA264e87b6da72D000f22186B4403081A2a',
      dxnAddress: '0xfe7714618a8cceD29788aa6D490BBF7c5522aA77',
      DBXenAddress: '0x6054A1dBC14bd1b1653727f3E4690DB4174d8F0c',
      iDBXenViews: '',
    },
  },
};

const DEFAULT_CHAIN_ID = 10;

export const getNetworkConfig = (chainId: bigint | number | null): NetworkConfig => {
  const id = chainId ? Number(chainId) : DEFAULT_CHAIN_ID;
  return NETWORKS[id] || NETWORKS[DEFAULT_CHAIN_ID];
};

export const hasConfiguredAddresses = (config: NetworkConfig): boolean => {
  return Boolean(
    config.addresses.protocolAddress && config.addresses.protocolAddress.trim() !== ''
  );
};
