# NXDv3 Protocol & Staking Hub

A decentralized finance (DeFi) application for interacting with the NXDv3 Protocol on Optimism and PulseChain networks. Features a modern React-based UI with wallet connectivity via Reown AppKit (WalletConnect).

## Features

- **Wallet Connection** - Connect via Reown AppKit (WalletConnect) supporting multiple wallet providers
- **Protocol Statistics** - View real-time protocol metrics including total burned, staked, and minted tokens
- **Staking Dashboard** - Monitor and interact with vault staking positions
- **Interactive Charts** - Visualize epoch burn data, supply breakdown, mint tiers, and vault rewards
- **Deposit Interface** - Mint NXD tokens through the deposit mechanism
- **Multi-chain Support** - Works on Optimism and PulseChain networks

## Tech Stack

- **Frontend:** React 18, TypeScript
- **Build Tool:** Vite
- **Blockchain:** ethers.js v6, Multicall3 for batch RPC calls
- **Wallet:** Reown AppKit, ethers adapter
- **Charts:** Chart.js, react-chartjs-2
- **Testing:** Vitest, Testing Library, Playwright
- **Code Quality:** ESLint, Prettier, Knip

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/cDx-X/nxdv3-ui.git
cd nxdv3-ui

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
# Edit .env with your configuration
```

### Development

```bash
# Start development server
npm run dev
```

### Build

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

### Testing

The suite has three layers:

| Layer | Tool | Location | Purpose |
| :--- | :--- | :--- | :--- |
| Unit / component | Vitest + Testing Library | `src/**/__tests__/` | Isolated components and utilities with mocked contracts |
| Integration (flow) | Vitest + Testing Library + `chainSim` | `src/integration/__tests__/` | Multi-step user journeys (connect → approve → deposit/stake) against a simulated chain |
| End-to-end | Playwright | `e2e/` | Real browser against the Vite dev server |

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Generate coverage report
npm run test:coverage

# Browser end-to-end suite (see e2e/README.md for the one-time browser install)
npm run test:e2e

# Playwright interactive UI mode
npm run test:e2e:ui
```

The integration harness (`src/integration/harness/`) replaces `ethers.Contract` and the
`WalletContext` / `ProtocolContext` hooks with an in-memory chain that tracks balances,
allowances, stakes, rewards and the withdrawal cooldown. Transactions are mined
explicitly, so tests can assert both the pending screen (`Approving...`) and the
post-confirmation state:

```ts
chain.reset({ dxnBalance: e18(1000) });
await connectWallet();          // publishes wallet state to the components
await changeInput(screen.getByPlaceholderText('0.0 NXDv3'), '100');
await click(screen.getByRole('button', { name: /Approve DXNv2 for Protocol/ }));
expect(chain.pending[0]?.method).toBe('approve');
await minePending();            // finalises the block
expect(chain.state.dxnAllowance).toBe(e18(1_000_000_000));
```

## Project Structure

```
├── e2e/                     # Playwright specs (browser level)
├── src/
│   ├── components/          # React UI components
│   │   ├── __tests__/       # Component tests
│   │   ├── Header.tsx       # Navigation header
│   │   ├── Footer.tsx       # Footer with contract addresses
│   │   ├── ProtocolInfoCard.tsx
│   │   ├── ProtocolDeposit.tsx
│   │   ├── VaultStaking.tsx
│   │   └── ...              # Chart components
│   ├── context/             # React context providers
│   │   ├── ProtocolContext.tsx
│   │   └── WalletContext.tsx
│   ├── integration/         # Cross-component flow tests + chain simulator harness
│   ├── utils/               # Utility functions
│   │   ├── multicall.ts     # Multicall3 batch calls
│   │   ├── rpcProvider.ts   # RPC failover handling
│   │   └── ...
│   ├── styles/              # CSS stylesheets
│   ├── setupTests.ts        # Test configuration
│   └── App.tsx              # Main application entry
├── public/                  # Static assets
├── vercel.json              # Vercel deployment config
├── playwright.config.ts     # Playwright configuration
├── vite.config.ts           # Vite configuration
├── vitest.config.ts         # Vitest configuration
└── package.json
```

## Deployment

This project is configured for deployment on Vercel. The `vercel.json` includes security headers (CSP, HSTS, X-Frame-Options, etc.).

### Deploy to Vercel

1. Import this repository on Vercel
2. Framework preset: Vite
3. Build command: `npm run build`
4. Output directory: `dist`

### Production checklist (wallet connection)

If the wallet connection gets stuck on **"Connecting..."** (especially on a phone after deploying), check these in order:

1. **Set the Reown (WalletConnect) Project ID in Vercel** — `.env` is gitignored, so the value is **not** committed. Add it under
   Vercel → Project → Settings → Environment Variables and redeploy:
   - Name: `VITE_WALLETCONNECT_PROJECT_ID`
   - Value: your Project ID from https://cloud.reown.com (the same one used locally)

2. **Allowlist your production domain in Reown Cloud** — the most common cause of an infinite "Connecting..." state.
   Connections are only accepted from origins registered in the project:
   - Open https://cloud.reown.com → your project → **Configuration** tab
   - In the **Domain** section click **+ Domain**, enter the exact deployed origin
     (e.g. `https://your-app.vercel.app` and/or the custom domain), click **Allowlist**
   - Propagation can take up to 5 minutes, then hard-refresh the app (clear the browser cache on the phone)
   - The app already reports its real origin (`window.location.origin`) to Reown, so no code change is needed per domain.

3. **Check the CSP headers** — `index.html` and `vercel.json` must stay in sync. Both already allow the WalletConnect
   relay (`wss://*.walletconnect.org`, `wss://*.walletconnect.com`) and now also `https://verify.walletconnect.com`.

4. **Known MetaMask mobile issue** — as of Aug 2026, a MetaMask mobile wallet update breaks validation of valid apps
   (per Reown docs). If you use MetaMask on the phone and see "Connecting..." forever, try:
   - the wallet app's built-in browser, or another wallet (Trust Wallet, Rabby, etc.),
   - or scan the app QR from a desktop session.

5. **Stuck state is now self-healing and cancellable** — since AppKit v1.8.x only clears the `connecting` status when the
   WalletConnect relay session completes, the UI used to stay stuck forever. `WalletContext` now:
   - resets the session silently after 30 seconds (`disconnect({ initialDisconnect: true })` — plain `disconnect()`
     doesn't clear a stuck "connecting" attempt) and releases the button back to "Connect Wallet" without an error banner;
   - releases the button immediately when you tap it while "Connecting..." (acts as Cancel), so the UI never stays
     locked even if AppKit never emits `disconnected` on its own.

6. **Session restore on page load (auto-reconnect)** — AppKit is created with `enableReconnect: true` (default), so
   refreshing the page or reopening it silently restores the previous wallet session WITHOUT asking the user to
   re-authorize. If the restore hangs (e.g. the WalletConnect relay is blocked on some mobile networks), the watchdog
   (item 5) resets the stuck state after 30 s and the user can tap Connect Wallet manually. On explicit **Disconnect**
   the app additionally calls `wallet_revokePermissions` (EIP-2255) so the wallet "forgets" the authorization — the next
   Connect shows a fresh prompt instead of "This account is already linked".

## License

Private - All rights reserved
