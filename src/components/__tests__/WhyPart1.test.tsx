import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { WhyPart1 } from '../WhyPart1';

describe('WhyPart1', () => {
  it('renders report title', () => {
    render(React.createElement(WhyPart1));
    expect(screen.getByText(/Comprehensive Technical Audit/i)).toBeInTheDocument();
    expect(screen.getByText(/NXD.*v2.*vs.*NXDv3/i)).toBeInTheDocument();
  });

  it('renders global overview section', () => {
    render(React.createElement(WhyPart1));
    expect(screen.getByText(/Global.*Architectural Overview/i)).toBeInTheDocument();
  });

  it('renders comparison table with NXD (v2) and NXDv3 columns', () => {
    render(React.createElement(WhyPart1));
    // The table headers appear in <th> elements — use getAllByText
    const nxdV2Headers = screen.getAllByText('NXD (v2)');
    expect(nxdV2Headers.length).toBeGreaterThan(0);
    const nxdv3Headers = screen.getAllByText('NXDv3');
    expect(nxdv3Headers.length).toBeGreaterThan(0);
  });

  it('lists all architectural aspects in the table', () => {
    render(React.createElement(WhyPart1));
    expect(screen.getByText(/Solidity Version/i)).toBeInTheDocument();
    expect(screen.getByText(/Execution Paradigm/i)).toBeInTheDocument();
    expect(screen.getByText(/MEV.*Gas Footprint/i)).toBeInTheDocument();
    expect(screen.getByText(/Target Network/i)).toBeInTheDocument();
    expect(screen.getByText(/New Ecosystem Assets/i)).toBeInTheDocument();
  });

  it('shows synchronous vs asynchronous execution comparison', () => {
    render(React.createElement(WhyPart1));
    const syncElements = screen.getAllByText(/Synchronous Execution/i);
    expect(syncElements.length).toBeGreaterThan(0);
    const asyncElements = screen.getAllByText(/Asynchronous Execution/i);
    expect(asyncElements.length).toBeGreaterThan(0);
  });

  it('shows Optimism L2 network info', () => {
    render(React.createElement(WhyPart1));
    expect(screen.getByText(/L2.*Optimism/i)).toBeInTheDocument();
    expect(screen.getByText(/OP WETH/i)).toBeInTheDocument();
    expect(screen.getByText(/opDXN/i)).toBeInTheDocument();
  });

  it('mentions XEN token integration', () => {
    render(React.createElement(WhyPart1));
    expect(screen.getByText(/XEN Token/i)).toBeInTheDocument();
  });
});
