import React from 'react';

export const WhyPart6: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: 'var(--accent-gold)', fontSize: '1.1rem' }}
        >
          7. Security & Architectural Conclusions
        </h3>
        <p style={{ marginBottom: '1rem' }}>
          The architectural overhaul in <strong>NXDv3</strong> addresses critical attack vectors and
          inefficiencies present in v2:
        </p>
        <ol
          style={{
            paddingLeft: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            listStyleType: 'decimal',
          }}
        >
          <li>
            <strong>MEV Neutralization:</strong> Moving Uniswap router interactions out of the
            standard ERC-20 transfer and ETH receive hooks into dedicated processing functions
            eliminates sandwich attacks on everyday token transfers.
          </li>
          <li>
            <strong>Gas Predictability & DoS Resilience:</strong> Removing heavy external contract
            calls and swaps from <code>_update()</code> ensures low, stable gas consumption and
            eliminates Out-of-Gas execution failures.
          </li>
          <li>
            <strong>True Decentralization & 100% Value Accrual:</strong> Completely eliminating
            developer fee cuts (0% dev allocation in mints, taxes, and ETH revenue) channels 100% of
            protocol throughput directly into deflationary buybacks (NXD/DXN burns), liquidity
            depth, and yield distributions (ETH + XEN) for stakers.
          </li>
        </ol>
      </div>
    </div>
  );
};
