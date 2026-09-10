import React from 'react';

export const WhyPart1: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <p
          className="lead-text"
          style={{
            color: 'var(--text-primary)',
            fontWeight: 500,
            fontSize: '1.05rem',
            marginBottom: '0.5rem',
          }}
        >
          Comprehensive Technical Audit & Comparison Report: NXD (v2) vs. NXDv3
        </p>
        <p>
          This document outlines all architectural, security, algorithmic, and parameter differences
          between the legacy <strong>NXD (v2)</strong> codebase and the optimized{' '}
          <strong>NXDv3</strong> smart contract suite.
        </p>
      </div>

      <div>
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: 'var(--accent-gold)', fontSize: '1.1rem' }}
        >
          1. Global & Architectural Overview
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.85rem',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                <th style={{ padding: '10px' }}>Aspect</th>
                <th style={{ padding: '10px' }}>NXD (v2)</th>
                <th style={{ padding: '10px' }}>NXDv3</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Solidity Version
                </td>
                <td style={{ padding: '10px' }}>
                  <code>^0.8.13</code> (and <code>&gt;=0.8.0</code> in auxiliary files)
                </td>
                <td style={{ padding: '10px' }}>
                  <code>^0.8.20</code> across all files
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Execution Paradigm
                </td>
                <td style={{ padding: '10px' }}>
                  <strong>Synchronous Execution:</strong> DEX swaps, tax distribution, oracle
                  consultations, and LP additions were performed inside standard ERC-20 transfers (
                  <code>_transfer</code>) and the ETH <code>receive()</code> hook.
                </td>
                <td style={{ padding: '10px' }}>
                  <strong>Asynchronous Execution:</strong> ERC-20 transfers and ETH receipts only
                  accumulate balances on the contracts. Heavy logic and DEX interactions are
                  decoupled into explicit processing functions (<code>processTax()</code>,{' '}
                  <code>processRewards()</code>).
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  MEV & Gas Footprint
                </td>
                <td style={{ padding: '10px' }}>
                  Vulnerable to sandwich attacks during regular transfers; high and unpredictable
                  transfer gas costs; risk of Out-of-Gas (OOG) denial-of-service.
                </td>
                <td style={{ padding: '10px' }}>
                  Drastically reduced ERC-20 transfer gas costs; complete elimination of
                  transfer-level MEV sandwich attack vectors.
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Target Network / Addresses
                </td>
                <td style={{ padding: '10px' }}>
                  Configured for <strong>Ethereum Mainnet</strong> (e.g., standard WETH{' '}
                  <code>0xC02aaA39...</code>, Mainnet DXN <code>0x1B08d31...</code>).
                </td>
                <td style={{ padding: '10px' }}>
                  Configured for <strong>L2 (Optimism)</strong> (e.g., OP WETH{' '}
                  <code>0x4200000000000000000000000000000000000006</code>, opDXN{' '}
                  <code>0x90386DA...</code>).
                </td>
              </tr>
              <tr>
                <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  New Ecosystem Assets
                </td>
                <td style={{ padding: '10px' }}>Supported only DXN and NXD.</td>
                <td style={{ padding: '10px' }}>
                  Added integration with <strong>XEN Token</strong> (<code>0xeB585...</code>) and
                  Uniswap V3 <code>XEN_WETH_POOL</code>.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
