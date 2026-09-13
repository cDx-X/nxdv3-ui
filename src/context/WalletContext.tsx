import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ethers } from 'ethers';
import { RouterController, ChainController } from '@reown/appkit-controllers';
import {
  NetworkConfig,
  NETWORKS,
  getNetworkConfig,
  hasConfiguredAddresses,
} from '../config/networks';
import { ensureAppKit, preloadReownFont } from '../config/walletConnect';

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
  const { open, close } = appkit.useAppKit();

  // KHTeka (Reown/AppKit's UI font) is only used once the wallet modal renders,
  // so we preload it just-in-time, right before the modal opens. This keeps the
  // font ready for the first modal paint WITHOUT a static <link rel="preload">
  // in index.html, which caused a "preloaded using link preload but not used"
  // console warning on every page load (the font was fetched but stayed unused
  // until the user opened the wallet modal).
  const openModal = useCallback(async () => {
    preloadReownFont();
    await open();
  }, [open]);

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
  // Local override: while AppKit's internal status can stay stuck on
  // 'connecting' (e.g. a WalletConnect relay session that never completes on a
  // mobile network), we still want the UI to return to a usable state after the
  // user cancels or the watchdog fires. This flag "releases" the button even if
  // AppKit never emits 'disconnected' on its own.
  const [connectionReset, setConnectionReset] = useState(false);

  const isConnecting = status === 'connecting' && !connectionReset;
  const isConnected = Boolean(appKitIsConnected && appKitAddress);

  // A WalletConnect session can get stuck in the "connecting" state forever
  // (e.g. the relay WebSocket cannot be established on some mobile networks,
  // or the deployed origin is not allowlisted in the Reown Cloud project).
  // AppKit only clears this state when the WC relay session completes or
  // throws, so without a watchdog the "Connect Wallet" button stays disabled
  // and shows "Connecting..." indefinitely. Watchdog: if the status stays
  // 'connecting' for too long, reset AppKit so the user can retry, and
  // surface a hint about the most common causes (incl. the current origin,
  // which must be allowlisted in cloud.reown.com).
  const CONNECT_TIMEOUT_MS = 30000;
  const connectingSinceRef = useRef<number | null>(null);

  useEffect(() => {
    if (status === 'connecting' && !connectingSinceRef.current) {
      connectingSinceRef.current = Date.now();
    } else if (status !== 'connecting') {
      connectingSinceRef.current = null;
    }
  }, [status]);

  // If AppKit eventually settles on a non-connecting status on its own, release
  // the local override so the regular status drives the UI again.
  useEffect(() => {
    if (status !== 'connecting') {
      setConnectionReset(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Asks AppKit to fully drop any in-progress connection. NOTE: without
  // `initialDisconnect: true` AppKit only detaches sessions that already have an
  // address — a stuck "connecting" attempt would never be released, which is why
  // both the manual Cancel button and the watchdog below use this helper.
  //
  // IMPORTANT: after modal.disconnect() we ALSO call ChainController.resetAccount().
  // In AppKit 1.8.x modal.disconnect() does not reliably propagate the account-state
  // change to React hooks (appKitIsConnected / appKitAddress stay set), so Deposit /
  // Staking still render as "connected" even though the header button already shows
  // "Connect Wallet". Resetting ONLY the account state fixes that, while leaving
  // network/provider/connector state untouched — those are needed to establish a
  // NEW connection (previous attempt to reset all controllers broke reconnection).
  const resetAppKitConnection = useCallback(async () => {
    try {
      const { modal } = await ensureAppKit();
      // Ask AppKit to disconnect (with a timeout so a stuck call can't hang forever).
      await Promise.race([
        modal.disconnect({ initialDisconnect: true }),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
      try {
        modal.close();
      } catch {
        // Modal may already be closed — ignore.
      }
      // Force-clear the ACCOUNT state if modal.disconnect() didn't propagate.
      // This clears appKitIsConnected / appKitAddress (Deposit/Staking go back to
      // "connect your wallet") WITHOUT touching network/provider/connector state
      // that AppKit needs for a fresh reconnection.
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const namespace: any = ChainController.state.activeChain ?? 'eip155';
        ChainController.resetAccount(namespace);
      } catch (e) {
        console.error('Error clearing AppKit account state:', e);
      }
    } catch (e) {
      console.error('Error resetting AppKit connection state:', e);
    }
  }, []);

  useEffect(() => {
    if (status !== 'connecting') {
      return;
    }
    const timer = setTimeout(async () => {
      const startedAt = connectingSinceRef.current;
      if (startedAt && Date.now() - startedAt >= CONNECT_TIMEOUT_MS) {
        connectingSinceRef.current = null;
        await resetAppKitConnection();
        setConnectionReset(true);
        setError(
          `Wallet connection timed out — the WalletConnect session wasn't completed on this device. ` +
            `On a phone: open this page inside your wallet app's browser (MetaMask, Trust, Rabby) or scan the QR ` +
            `with your wallet app from a desktop; make sure the network doesn't block wss://relay.walletconnect.org; ` +
            `and confirm ${window.location.origin} is allowlisted in cloud.reown.com → Configuration → Domain. ` +
            `Tap Connect Wallet to retry.`
        );
      }
    }, CONNECT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [status, setError, resetAppKitConnection]);

  // AppKit's modal is a web component whose Account View (Fund wallet / Swap /
// Send / Activity) is rendered internally after a successful connection. React
// state updates (appKitIsConnected) only fire AFTER that view is already shown,
// so closing via a setState/effect leaves a visible flash. Instead we subscribe
// to AppKit's RouterController synchronously and close the modal the instant the
// view changes to 'Account' — before the web component paints the Account View.
useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = RouterController.subscribeKey('view', (view) => {
        if (view === 'Account') {
          // Close synchronously inside the subscription callback so the modal
          // closes before the browser paints the Account View.
          try {
            close();
          } catch {
            // Modal may already be closing/closed — ignore.
          }
        }
      });
    } catch (e) {
      console.error('Failed to subscribe to AppKit RouterController:', e);
    }
    return () => {
      unsubscribe?.();
    };
  }, [close]);

  // If the user clicked "Connect Wallet" before AppKit finished loading, open the
  // modal as soon as the inner provider (with the working hooks) mounts.
  useEffect(() => {
    if (pendingOpen) {
      openModal();
      onOpened();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOpen, openModal]);

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

  const disconnectWallet = useCallback(async () => {
    // Revoke the wallet's eth_accounts permission (EIP-2255) BEFORE AppKit clears
    // the provider. Without this, injected wallets (Rabby, MetaMask, etc.) remember
    // the authorization and show "This account is already linked" when the user
    // tries to reconnect. Revoking makes the wallet "forget" the dApp so a fresh
    // connection prompt is shown on reconnect.
    try {
      if (walletProvider) {
        await (walletProvider as unknown as Eip1193Provider).request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        });
      }
    } catch {
      // Not all wallets support wallet_revokePermissions — ignore and continue.
    }
    // Release the UI immediately, then fully reset AppKit.
    setConnectionReset(true);
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setChainId(null);
    setError(null);
    setNetworkWarning(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Fully disconnect from AppKit in the background (await so a stuck
    // "connecting" attempt is properly dropped before any reconnect).
    await resetAppKitConnection();
  }, [resetAppKitConnection, walletProvider]);

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
    setConnectionReset(false);
    try {
      await openModal();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj?.message || 'Failed to open connection modal.');
    }
  }, [openModal]);

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

  // Preload AppKit ONLY on desktop (viewport > 900 px matches the app's mobile
  // breakpoint). On desktop there is plenty of memory, so preloading lets
  // `enableReconnect` silently restore the previous wallet session right after
  // page load — the user sees the connected state WITHOUT re-authorizing.
  // On mobile, AppKit stays lazy-loaded (on first Connect click): loading the
  // large WalletConnect bundle shortly after page load spikes memory on phones,
  // which triggers the browser to auto-reload the tab. Mobile users tap
  // Connect Wallet once and the stored session is restored instantly (no
  // re-authorization needed).
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth <= 900) {
      return;
    }
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
