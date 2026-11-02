import React from 'react';

export const AuditPart3: React.FC = () => {
  return (
    <div className="audit-section-stack">
      <div>
        <h3>3. Mathematical & Economic Verification</h3>

        <div className="audit-block">
          <h4>A. Transfer Tax Flow (5% Total Tax)</h4>
          <p>For an exemplary transaction of 100 NXD:</p>
          <div className="audit-calculation">
            <div>Recipient Receives: 95.0 NXD</div>
            <div style={{ marginTop: '0.5rem' }}>Total Tax Collected: 5.0 NXD (100%)</div>
            <div style={{ marginTop: '0.5rem' }}>Layer 1: NXDv3ERC20 Split</div>
            <div style={{ paddingLeft: '1rem' }}>
              Direct Burn (30%): 5.0 × 0.30 = 1.5 NXD (1.5% of transfer)
            </div>
            <div style={{ paddingLeft: '1rem' }}>
              TaxRecipientV3 (70%): 5.0 × 0.70 = 3.5 NXD (3.5% of transfer)
            </div>
            <div style={{ marginTop: '0.5rem' }}>Layer 2: TaxRecipientV3 Operations on 3.5 NXD</div>
            <div style={{ paddingLeft: '1rem' }}>
              Swap to DXN: 3.5 × 4/7 = 2.0 NXD equivalent swapped to DXN
            </div>
            <div style={{ paddingLeft: '1rem', marginTop: '0.25rem' }}>
              DBXen Staking: 25% of DXN received ≡ 2.0 × 0.25 = 0.5 NXD equivalent (10% of total
              tax)
            </div>
            <div style={{ paddingLeft: '1rem' }}>
              LP Provisioning DXN: 75% of DXN received ≡ 2.0 × 0.75 = 1.5 NXD equivalent
            </div>
            <div style={{ paddingLeft: '1rem' }}>
              LP Provisioning NXD: 3.5 − 2.0 = 1.5 NXD remaining
            </div>
            <div style={{ paddingLeft: '1rem', marginTop: '0.25rem' }}>
              Resulting LP Ratio: 1.5 NXD worth of DXN paired with 1.5 NXD
            </div>
            <div style={{ paddingLeft: '1rem' }}>
              Parity: Exactly 1:1 value ratio for balanced Uniswap V2 LP minting.
            </div>
          </div>

          <div className="audit-calculation audit-calculation-tree">
            {`Total Tax (5.0 NXD)
    ├── 30% Burned Immediately (1.5 NXD)
    └── 70% to TaxRecipientV3 (3.5 NXD)
         ├── 4/7 Swapped to DXN (2.0 NXD)
         │    ├── 25% Staked in DBXen (0.5 NXD)
         │    └── 75% for LP Pairing (1.5 NXD equiv.)
         └── 3/7 Retained for LP Pairing (1.5 NXD)`}
          </div>
        </div>

        <div className="audit-block">
          <h4>B. DBXen Protocol Fee Distribution</h4>
          <p>For an exemplary reward harvest of 1.00 ETH:</p>
          <div className="audit-calculation audit-calculation-tree">
            {`Harvested DBXen Fees (1.00 ETH)
    ├── 70% Swapped to DXN (0.70 ETH)
    │    ├── 10% Burned to DEAD (0.07 ETH equiv.)
    │    ├── 35% Staked in DBXen (0.245 ETH equiv.)
    │    └── ~55% Swapped for NXD and Burned (0.385 ETH equiv.)
    ├── 15% Sent to Staking Vault as ETH (0.15 ETH)
    └── 15% Swapped to XEN & Sent to Staking Vault (0.15 ETH equiv.)`}
          </div>
        </div>
      </div>
    </div>
  );
};
