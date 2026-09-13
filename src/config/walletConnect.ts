/* eslint-disable @typescript-eslint/no-explicit-any */
// Lazy AppKit (Reown / WalletConnect) initialization.
//
// AppKit is NOT loaded or initialized at module load time. It is only loaded
// dynamically (via `import()`) the first time the user clicks "Connect Wallet".
// This keeps ~2-4 MB of AppKit/WalletConnect code out of the critical path of
// the initial page load, so the app becomes interactive much faster.

let appKitPromise: Promise<{
  modal: any;
  optimism: any;
  pulsechain: any;
}> | null = null;

// Reown/AppKit's wallet modal renders its UI with the 'KHTeka' font hosted on
// fonts.reown.com. That font is only used once the modal actually renders, so we
// do NOT preload it statically in index.html — a static <link rel="preload">
// fetched the font on every page load but left it unused for several seconds,
// which made the browser log: "The resource ... was preloaded using link preload
// but not used within a few seconds from the window's load event."
//
// Instead we preload it just-in-time, right before the modal opens (see
// WalletContext). The font is then fetched only when it will actually be used,
// so the warning never fires and the first modal paint still has the font ready.
const REOWN_FONT_URL = 'https://fonts.reown.com/KHTeka-Medium.woff2';
let reownFontPreloaded = false;

export function preloadReownFont() {
  if (reownFontPreloaded || typeof document === 'undefined') {
    return;
  }
  reownFontPreloaded = true;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = REOWN_FONT_URL;
  link.as = 'font';
  link.type = 'font/woff2';
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

export function ensureAppKit() {
  if (!appKitPromise) {
    appKitPromise = (async () => {
      const [{ createAppKit }, { EthersAdapter }, { optimism, pulsechain }] = await Promise.all([
        import('@reown/appkit/react'),
        import('@reown/appkit-adapter-ethers'),
        import('@reown/appkit/networks'),
      ]);

      const projectId =
        import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

      if (!projectId || projectId === 'your_walletconnect_project_id_here') {
        throw new Error(
          'VITE_WALLETCONNECT_PROJECT_ID is not configured. ' +
          'Please create a .env file based on .env.example and set your Project ID from https://cloud.reown.com'
        );
      }

      const metadata = {
        name: 'NXD v3 Protocol & Staking Vault',
        description: 'NXD v3 Protocol & Staking Vault UI',
        url: window.location.origin,
        icons: [],
      };

      const modal = createAppKit({
        adapters: [new EthersAdapter()],
        networks: [optimism, pulsechain],
        metadata,
        projectId,
        // Silently restore a previous session on page load (default behavior).
        // The wallet remembers the authorization, so refreshing the page or
        // reopening it reconnects WITHOUT asking the user to re-authorize.
        // If the restore hangs (e.g. the WalletConnect relay is blocked on some
        // mobile networks), WalletContext's watchdog resets the stuck state after
        // 30s and the user can tap Connect Wallet manually — no deadlock.
        enableReconnect: true,
        features: {
          analytics: false,
          email: false,
          socials: false,
        },
      });

      return { modal, optimism, pulsechain };
    })();
  }
  return appKitPromise;
}
