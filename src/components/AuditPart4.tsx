import React from 'react';

export const AuditPart4: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: 'var(--accent-gold)', fontSize: '1.05rem' }}
        >
          3. Operational Best Practices & Recommendations
        </h3>
        <ol
          style={{
            paddingLeft: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          <li>
            <strong>
              Pool Initialization Flow (<code>createPool</code>)
            </strong>
            :
            <p style={{ marginTop: '0.2rem' }}>
              <code>createPool</code> in <code>NXDv3Protocol</code> can be invoked once to pair
              initial NXD and DXN and deploy the <code>V2Oracle</code>. Since all initial NXD tokens
              are minted to <code>_initialSupplyTo</code>, ensure <code>createPool</code> is called
              by the admin right after contract deployment before distributing any tokens.
            </p>
          </li>
          <li>
            <strong>P2P Transfer Tax Confirmation</strong>:
            <p style={{ marginTop: '0.2rem' }}>
              With the current whitelist configuration, standard wallet-to-wallet transfers incur
              the 5% tax (since neither sender nor recipient is whitelisted). Ensure this matches
              your project's desired tokenomics.
            </p>
          </li>
          <li>
            <strong>Oracle TWAP Warm-Up</strong>:
            <p style={{ marginTop: '0.2rem' }}>
              After creating the Uniswap V2 pair, <code>v2Oracle</code> requires at least one update
              interval before <code>consult()</code> returns valid TWAP quotes. During this brief
              initial period, <code>amountOutMin == 0</code> conditions are skipped safely without
              reverting transactions.
            </p>
          </li>
        </ol>
      </div>
    </div>
  );
};
