import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(),
  },
}));

import mermaid from 'mermaid';
import { MermaidDiagram } from '../MermaidDiagram';

describe('MermaidDiagram', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title if provided', () => {
    vi.mocked(mermaid.render).mockResolvedValue({
      svg: '<svg>test</svg>',
      bindFunctions: vi.fn(),
    } as any);

    render(<MermaidDiagram chart="graph TD; A-->B;" title="Architecture Flow" />);

    expect(screen.getByText('Architecture Flow')).toBeInTheDocument();
  });

  it('renders svg output from mermaid.render', async () => {
    vi.mocked(mermaid.render).mockResolvedValue({
      svg: '<svg data-testid="generated-svg"><text>Node</text></svg>',
      bindFunctions: vi.fn(),
    } as any);

    const { container } = render(<MermaidDiagram chart="graph TD; A-->B;" />);

    await waitFor(() => {
      expect(container.querySelector('[data-testid="generated-svg"]')).toBeInTheDocument();
    });
    expect(mermaid.render).toHaveBeenCalledWith(
      expect.stringMatching(/^mermaid-/),
      'graph TD; A-->B;'
    );
  });

  it('displays error message when mermaid.render throws', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(mermaid.render).mockRejectedValue(new Error('Syntax error'));

    render(<MermaidDiagram chart="invalid chart" />);

    await waitFor(() => {
      expect(screen.getByText('Error rendering diagram')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('re-renders when chart prop changes', async () => {
    vi.mocked(mermaid.render)
      .mockResolvedValueOnce({ svg: '<svg id="v1"></svg>', bindFunctions: vi.fn() } as any)
      .mockResolvedValueOnce({ svg: '<svg id="v2"></svg>', bindFunctions: vi.fn() } as any);

    const { rerender, container } = render(<MermaidDiagram chart="chart1" />);

    await waitFor(() => {
      expect(container.querySelector('#v1')).toBeInTheDocument();
    });

    rerender(<MermaidDiagram chart="chart2" />);

    await waitFor(() => {
      expect(container.querySelector('#v2')).toBeInTheDocument();
    });

    expect(mermaid.render).toHaveBeenCalledTimes(2);
  });
});
