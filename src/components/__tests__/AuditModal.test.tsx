import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

vi.mock('../MermaidDiagram', () => ({
  MermaidDiagram: ({ title }: { title?: string }) => (
    <div data-testid="mermaid-mock">{title || 'Mermaid Diagram'}</div>
  ),
}));

import { AuditModal } from '../AuditModal';

describe('AuditModal', () => {
  it('does not render when closed', () => {
    const { container } = render(<AuditModal isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the audit report in the shared report layout', () => {
    const { container } = render(<AuditModal isOpen onClose={vi.fn()} />);
    expect(
      screen.getByRole('heading', { name: /A.I. Smart Contract Architecture/ })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '1. Executive Summary' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '4. Security & Vulnerability Analysis' })
    ).toBeInTheDocument();
    const modal = container.querySelector('.modal-content');
    expect(modal).toHaveStyle({ maxWidth: '900px' });
    expect(modal?.getAttribute('style')).toContain('92vw');
    const body = container.querySelector('.audit-body');
    expect(body).toBeInTheDocument();
    expect(body).toContainElement(screen.getByRole('table'));
    expect(screen.getAllByRole('row')).toHaveLength(9);
  });

  it('closes via buttons and backdrop, but not from a click inside the content', () => {
    const onClose = vi.fn();
    const { container } = render(<AuditModal isOpen onClose={onClose} />);
    fireEvent.click(screen.getByText('1. Executive Summary'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close Audit Report' }));
    fireEvent.click(container.firstElementChild!);
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
