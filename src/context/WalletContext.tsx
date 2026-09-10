import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import {
  NetworkConfig,
  NETWORKS,
  getNetworkConfig,
  hasConfiguredAddresses,
} from '../config/networks';
import { ensureAppKit } from '../config/walletConnect';

// Type of the dynamically imported AppKit React module (loaded lazily).
// Type for EIP-1193 provider (standard used by ethers.js)
interface Eip1193Provider {
  request(request: { method: string; params?: Array<any> | Record<string, any> }): Promise<any>;
}

type AppKitModule = typeof import('@reown/appkit/react');

interface WalletContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  address: string | null;
  chainId: bigint | null;
  networkConfig: NetworkConfig;
  hasAddresses: boolean;
  networkWarning: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (targetChainId: number) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

/**
 * Inner provider. Only mounted AFTER AppKit has been dynamically loaded and
 * initialized, so the AppKit hooks can be used safely here.
 */
const WalletProviderInner: React.FC<{
  appkit: AppKitModule;
  pendingOpen: boolean;
  onOpened: () => void;
  initError: string | null;
  children: React.ReactNode;
}> = ({ appkit, pendingOpen, onOpened, initError, children }) => {
  const { open } = appkit.useAppKit();
  const {
    address: appKitAddress,
    isConnected: appKitIsConnected,
    status,
  } = appkit.useAppKitAccount();
  const { chainId: appKitChainId, switchNetwork: appKitSwitchNetwork } = appkit.useAppKitNetwork();
  const { walletProvider } = appkit.useAppKitProvider('eip155');

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(initError);

  const isConnecting = status === 'connecting';
  const isConnected = Boolean(appKitIsConnected && appKitAddress);

  // If the user clicked "Connect Wallet" before AppKit finished loading, open the
  // modal as soon as the inner provider (with the working hooks) mounts.
  useEffect(() => {
    if (pendingOpen) {
      open();
      onOpened();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOpen]);

  const networkConfig = useMemo(() => getNetworkConfig(chainId), [chainId]);
  const hasAddresses = useMemo(() => hasConfiguredAddresses(networkConfig), [networkConfig]);
  const [networkWarning, setNetworkWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setNetworkWarning(null);
      return;
    }
    const currentChainIdNum = chainId ? Number(chainId) : 0;
    if (currentChainIdNum !== 10) {
      const currentNetName = NETWORKS[currentChainIdNum]?.name || `Chain ID ${currentChainIdNum}`;
      setNetworkWarning(
        `Note: Your wallet is connected to the wrong network. (${currentNetName}). The application requires the Optimism network.`
      );
    } else {
      setNetworkWarning(null);
    }
  }, [address, chainId]);

  const disconnectWallet = useCallback(() => {
    try {
      void ensureAppKit().then(({ modal }) => modal.disconnect());
    } catch (e) {
      console.error('Error disconnecting appKit:', e);
    }
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setChainId(null);
    setError(null);
    setNetworkWarning(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Sync provider and signer when walletProvider or appKitAddress changes
  useEffect(() => {
    let isMounted = true;
    async function setupProvider() {
      if (walletProvider && appKitAddress) {
        try {
          const browserProvider = new ethers.BrowserProvider(
            walletProvider as unknown as Eip1193Provider
          );
          const currentSigner = await browserProvider.getSigner();
          const net = await browserProvider.getNetwork();

          if (isMounted) {
            setProvider(browserProvider);
            setSigner(currentSigner);
            setAddress(appKitAddress);
            setChainId(net.chainId);
            setError(null);
          }
        } catch (err: unknown) {
          console.error('Failed to setup browser provider:', err);
          if (isMounted) {
            const errObj = err as { message?: string };
            setError(errObj?.message || 'Failed to initialize provider.');
          }
        }
      } else {
        if (isMounted) {
          setProvider(null);
          setSigner(null);
          setAddress(null);
          setChainId(null);
        }
      }
    }
    setupProvider();
    return () => {
      isMounted = false;
    };
  }, [walletProvider, appKitAddress]);

  // Sync chainId from AppKit network if available
  useEffect(() => {
    if (appKitChainId) {
      const numericId =
        typeof appKitChainId === 'string'
          ? parseInt(appKitChainId.includes(':') ? appKitChainId.split(':')[1] : appKitChainId, 10)
          : Number(appKitChainId);
      if (!isNaN(numericId)) {
        setChainId(BigInt(numericId));
      }
    }
  }, [appKitChainId]);

  const connectWallet = useCallback(async () => {
    setError(null);
    try {
      await open();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj?.message || 'Failed to open connection modal.');
    }
  }, [open]);

  const switchNetwork = useCallback(
    async (targetChainId: number) => {
      try {
        setError(null);
        const { optimism, pulsechain } = await ensureAppKit();
        const targetNet = targetChainId === 369 ? pulsechain : optimism;
        await appKitSwitchNetwork(targetNet);
      } catch (err: unknown) {
        const errObj = err as { message?: string };
        setError(errObj?.message || 'Failed to switch network.');
      }
    },
    [appKitSwitchNetwork]
  );

  const contextValue = React.useMemo<WalletContextType>(
    () => ({
      provider,
      signer,
      address,
      chainId,
      networkConfig,
      hasAddresses,
      networkWarning,
      isConnected,
      isConnecting,
      error,
      connectWallet,
      disconnectWallet,
      switchNetwork,
    }),
    [
      provider,
      signer,
      address,
      chainId,
      networkConfig,
      hasAddresses,
      networkWarning,
      isConnected,
      isConnecting,
      error,
      connectWallet,
      disconnectWallet,
      switchNetwork,
    ]
  );

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appkit, setAppkit] = useState<AppKitModule | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [pendingOpen, setPendingOpen] = useState(false);

  // Preload AppKit in the background shortly after the initial render, so that
  // clicking "Connect Wallet" is instant instead of blocking the UI while the
  // large AppKit bundle is downloaded, parsed and executed on the main thread.
  // The initial page load stays fast because AppKit is still kept out of the
  // critical path. Once initialized, AppKit is also promoted into state so the
  // inner provider mounts and AppKit can silently restore a wallet connection
  // persisted from a previous visit (no modal, no approval prompt needed).
  useEffect(() => {
    const t = setTimeout(() => {
      import('@reown/appkit/react')
        .then((mod) => ensureAppKit().then(() => setAppkit(mod)))
        .catch(() => {
          // Ignore — AppKit will be loaded on demand if the preload fails.
        });
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  // Dynamically load + initialize AppKit (idempotent).
  const loadAppKit = useCallback(
    async (openAfter: boolean) => {
      try {
        if (!appkit) {
          const mod = await import('@reown/appkit/react');
          await ensureAppKit();
          setAppkit(mod);
        }
        if (openAfter) {
          setPendingOpen(true);
        }
      } catch (err: unknown) {
        const errorObj = err as { message?: string };
        setInitError(errorObj?.message || 'Failed to initialize wallet connection.');
      }
    },
    [appkit]
  );

  // connectWallet used before AppKit is loaded: it loads AppKit and requests the
  // modal to open once the inner provider mounts.
  const fallbackConnect = useCallback(async () => {
    await loadAppKit(true);
  }, [loadAppKit]);

  const fallbackValue = useMemo<WalletContextType>(
    () => ({
      provider: null,
      signer: null,
      address: null,
      chainId: null,
      networkConfig: getNetworkConfig(null),
      hasAddresses: false,
      networkWarning: null,
      isConnected: false,
      isConnecting: false,
      error: initError,
      connectWallet: fallbackConnect,
      disconnectWallet: () => {},
      switchNetwork: async () => {},
    }),
    [initError, fallbackConnect]
  );

  if (!appkit) {
    return <WalletContext.Provider value={fallbackValue}>{children}</WalletContext.Provider>;
  }

  return (
    <WalletProviderInner
      appkit={appkit}
      pendingOpen={pendingOpen}
      onOpened={() => setPendingOpen(false)}
      initError={initError}
    >
      {children}
    </WalletProviderInner>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};
