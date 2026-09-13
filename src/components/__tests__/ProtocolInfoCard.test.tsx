import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Info: () => React.createElement('span', null, 'Info'),
  ChevronDown: () => React.createElement('span', null, 'ChevronDown'),
  ChevronUp: () => React.createElement('span', null, 'ChevronUp'),
}));

import { ProtocolInfoCard } from '../ProtocolInfoCard';

describe('ProtocolInfoCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders info card with title', () => {
    render(React.createElement(ProtocolInfoCard, {
      protocolAddress: "0x8C6f6ec2281D5678844556887DEDa5cEC907De87",
      nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
    }));

    expect(screen.getByText(/Protocol Info/)).toBeInTheDocument();
  });

  it('shows collapsed state by default', () => {
    render(React.createElement(ProtocolInfoCard, {
      protocolAddress: "0x8C6f6ec2281D5678844556887DEDa5cEC907De87",
      nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
    }));

    // Should show chevron down (collapsed)
    expect(screen.getByText('ChevronDown')).toBeInTheDocument();
  });

  it('expands when clicked', () => {
    render(React.createElement(ProtocolInfoCard, {
      protocolAddress: "0x8C6f6ec2281D5678844556887DEDa5cEC907De87",
      nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
    }));

    fireEvent.click(screen.getByText(/Protocol Info/));
    
    // Should show chevron up (expanded)
    expect(screen.getByText('ChevronUp')).toBeInTheDocument();
  });

  it('shows transfer tax breakdown when expanded', () => {
    render(React.createElement(ProtocolInfoCard, {
      protocolAddress: "0x8C6f6ec2281D5678844556887DEDa5cEC907De87",
      nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
    }));

    fireEvent.click(screen.getByText(/Protocol Info/));
    
    expect(screen.getByText(/Transfer Tax Breakdown/)).toBeInTheDocument();
  });

  it('shows ETH fee split when expanded', () => {
    render(React.createElement(ProtocolInfoCard, {
      protocolAddress: "0x8C6f6ec2281D5678844556887DEDa5cEC907De87",
      nxdAddress: "0x3d1758d8b7f47b0922A1e9b19465259092F28486"
    }));

    fireEvent.click(screen.getByText(/Protocol Info/));
    
    expect(screen.getByText(/ETH Fee Split/)).toBeInTheDocument();
  });
});
