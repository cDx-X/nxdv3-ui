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
