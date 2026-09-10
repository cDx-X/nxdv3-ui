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
- **Testing:** Vitest, Testing Library
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

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Generate coverage report
npm run test:coverage
```

## Project Structure

```
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
│   ├── utils/               # Utility functions
│   │   ├── multicall.ts     # Multicall3 batch calls
│   │   ├── rpcProvider.ts   # RPC failover handling
│   │   └── ...
│   ├── styles/              # CSS stylesheets
│   ├── setupTests.ts        # Test configuration
│   └── App.tsx              # Main application entry
├── public/                  # Static assets
├── vercel.json              # Vercel deployment config
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

## License

Private - All rights reserved
