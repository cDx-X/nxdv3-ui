import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import { RangeSlider } from '../RangeSlider';

describe('RangeSlider', () => {
  const defaultProps = {
    min: 0,
    max: 100,
    value: [20, 80] as [number, number],
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders range slider', () => {
    render(React.createElement(RangeSlider, defaultProps));

    const inputs = screen.getAllByRole('slider');
    expect(inputs).toHaveLength(2);
  });

  it('shows correct initial values', () => {
    render(React.createElement(RangeSlider, defaultProps));

    const inputs = screen.getAllByRole('slider');
    expect(inputs[0]).toHaveValue('20');
    expect(inputs[1]).toHaveValue('80');
  });

  it('calls onChange when lower handle is moved', () => {
    const onChange = vi.fn();
    render(React.createElement(RangeSlider, { ...defaultProps, onChange }));

    const inputs = screen.getAllByRole('slider');
    fireEvent.change(inputs[0], { target: { value: '30' } });

    expect(onChange).toHaveBeenCalledWith([30, 80]);
  });

  it('calls onChange when upper handle is moved', () => {
    const onChange = vi.fn();
    render(React.createElement(RangeSlider, { ...defaultProps, onChange }));

    const inputs = screen.getAllByRole('slider');
    fireEvent.change(inputs[1], { target: { value: '70' } });

    expect(onChange).toHaveBeenCalledWith([20, 70]);
  });

  it('prevents lower handle from exceeding upper handle', () => {
    const onChange = vi.fn();
    render(React.createElement(RangeSlider, { ...defaultProps, onChange }));

    const inputs = screen.getAllByRole('slider');
    fireEvent.change(inputs[0], { target: { value: '90' } });

    // Should be clamped to hi - 1
    expect(onChange).toHaveBeenCalledWith([79, 80]);
  });

  it('prevents upper handle from going below lower handle', () => {
    const onChange = vi.fn();
    render(React.createElement(RangeSlider, { ...defaultProps, onChange }));

    const inputs = screen.getAllByRole('slider');
    fireEvent.change(inputs[1], { target: { value: '10' } });

    // Should be clamped to lo + 1
    expect(onChange).toHaveBeenCalledWith([20, 21]);
  });

  it('respects min bound', () => {
    const onChange = vi.fn();
    render(React.createElement(RangeSlider, { ...defaultProps, onChange }));

    const inputs = screen.getAllByRole('slider');
    fireEvent.change(inputs[0], { target: { value: '-10' } });

    expect(onChange).toHaveBeenCalledWith([0, 80]);
  });

  it('respects max bound', () => {
    const onChange = vi.fn();
    render(React.createElement(RangeSlider, { ...defaultProps, onChange }));

    const inputs = screen.getAllByRole('slider');
    fireEvent.change(inputs[1], { target: { value: '150' } });

    expect(onChange).toHaveBeenCalledWith([20, 100]);
  });

  it('has correct aria labels', () => {
    render(React.createElement(RangeSlider, defaultProps));

    expect(screen.getByLabelText('Range start')).toBeInTheDocument();
    expect(screen.getByLabelText('Range end')).toBeInTheDocument();
  });
});
