/* eslint-disable @typescript-eslint/no-explicit-any */
// Lazy AppKit (Reown / WalletConnect) initialization.
//
// AppKit is NOT loaded or initialized at module load time. It is only loaded
// dynamically (via `import()`) the first time the user clicks "Connect Wallet"
// (or after a 1.5s delay on desktop).
// This keeps ~2-4 MB of AppKit/WalletConnect code out of the critical path of
// the initial page load, so the app becomes interactive much faster.

let appKitPromise: Promise<{
  modal: any;
  optimism: any;
  pulsechain: any;
}> | null = null;

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
        // By default, Reown's ThemeUtil injects <link rel="preload"> tags for 8
        // KHTeka font variants hosted on fonts.reown.com (including KHTeka-Medium.woff2).
        // Because Reown's CSS does not define an @font-face for KHTeka-Medium, and
        // the modal is not open at window load time, Chromium logs:
        // "The resource https://fonts.reown.com/KHTeka-Medium.woff2 was preloaded
        // using link preload but not used within a few seconds from the window's load event."
        //
        // Providing custom font-family themeVariables sets `hasCustomFont = true`
        // in Reown's ThemeUtil, which skips the entire KHTeka font preload loop and
        // renders the wallet modal with the application's native Inter font.
        themeVariables: {
          '--w3m-font-family': "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          '--apkt-font-family': "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
      });

      return { modal, optimism, pulsechain };
    })();
  }
  return appKitPromise;
}
