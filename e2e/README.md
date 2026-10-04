# End-to-end tests (Playwright)

Browser-level specs for the NXDv3 dashboard. They complement the Vitest layers
(`src/**/__tests__` = unit/component, `src/integration/__tests__` = flow tests on the
simulated chain) by driving the real application in Chromium.

## One-time setup

```bash
npm install -D @playwright/test   # already in devDependencies
npx playwright install chromium   # downloads the browser (skipped by .npmrc allow-scripts)
```

## Running

```bash
npm run test:e2e        # headless, boots the Vite dev server on :5173
npm run test:e2e:ui     # Playwright UI mode (watch/debug)
npx playwright test e2e/dashboard.spec.ts --headed   # single spec, visible browser
```

Against an already running deployment instead of a local dev server:

```bash
E2E_BASE_URL=https://your-preview-url npm run test:e2e
```

Failure artefacts (screenshots, traces, HTML report) are written to `playwright-report/`
and `test-results/`; open the report with `npx playwright show-report`.

## Specs

| Spec | Status | Covers |
| :--- | :--- | :--- |
| `dashboard.spec.ts` | runs today | Header/hero/footer, both contract cards in the disconnected state, lazy-loaded charts view and navigation back |
| `deposit-flow.spec.ts` | scaffolded (`test.fixme`) | Connect Wallet → Approve → Deposit & Mint, plus wallet rejection |

## Wiring the wallet specs

`deposit-flow.spec.ts` describes the target behaviour but is marked `fixme` because two
pieces are still missing:

1. `helpers/mockWallet.ts` already injects a minimal EIP-1193 provider via
   `page.addInitScript` so Reown AppKit can discover a wallet. It needs to be extended
   for the signature/transaction methods the deposit flow uses (`personal_sign`,
   `eth_sendTransaction`) including a "user rejects" mode.
2. The read path (`src/utils/rpcProvider.ts` → `Multicall3.aggregate3`) must be stubbed
   with `page.route('**', ...)` returning ABI-encoded fixtures. Without it the specs hit
   the public Optimism RPC and become slow/flaky. The state machine in
   `src/integration/harness/chainSim.ts` can be reused to generate those fixtures.

Until then, wallet-driven journeys are fully covered at the integration layer, which is
faster and deterministic.
