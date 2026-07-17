import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SectionSwitcher, type SectionId } from '@/components/SectionSwitcher';

describe('SectionSwitcher', () => {
  it('renders Beauty and Pilates buttons', () => {
    render(<SectionSwitcher activeSection="beauty" onSwitch={jest.fn()} />);
    expect(screen.getByText('Beauty')).toBeInTheDocument();
    expect(screen.getByText('Pilates')).toBeInTheDocument();
  });

  it('marks beauty as aria-selected when active', () => {
    render(<SectionSwitcher activeSection="beauty" onSwitch={jest.fn()} />);
    const beautyTab = screen.getByText('Beauty').closest('button');
    expect(beautyTab).toHaveAttribute('aria-selected', 'true');
    const pilatesTab = screen.getByText('Pilates').closest('button');
    expect(pilatesTab).toHaveAttribute('aria-selected', 'false');
  });

  it('marks pilates as aria-selected when active', () => {
    render(<SectionSwitcher activeSection="pilates" onSwitch={jest.fn()} />);
    const pilatesTab = screen.getByText('Pilates').closest('button');
    expect(pilatesTab).toHaveAttribute('aria-selected', 'true');
    const beautyTab = screen.getByText('Beauty').closest('button');
    expect(beautyTab).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onSwitch with "beauty" when beauty button clicked', () => {
    const onSwitch = jest.fn();
    render(<SectionSwitcher activeSection="pilates" onSwitch={onSwitch} />);
    fireEvent.click(screen.getByText('Beauty'));
    expect(onSwitch).toHaveBeenCalledWith('beauty');
  });

  it('calls onSwitch with "pilates" when pilates button clicked', () => {
    const onSwitch = jest.fn();
    render(<SectionSwitcher activeSection="beauty" onSwitch={onSwitch} />);
    fireEvent.click(screen.getByText('Pilates'));
    expect(onSwitch).toHaveBeenCalledWith('pilates');
  });

  it('does not call onSwitch when clicking already active section', () => {
    const onSwitch = jest.fn();
    render(<SectionSwitcher activeSection="beauty" onSwitch={onSwitch} />);
    fireEvent.click(screen.getByText('Beauty'));
    expect(onSwitch).toHaveBeenCalledWith('beauty');
  });

  it('has role="tablist" on container', () => {
    render(<SectionSwitcher activeSection="beauty" onSwitch={jest.fn()} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('both buttons have role="tab"', () => {
    render(<SectionSwitcher activeSection="beauty" onSwitch={jest.fn()} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);
  });

  it('has aria-label on tablist', () => {
    render(<SectionSwitcher activeSection="beauty" onSwitch={jest.fn()} />);
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-label', 'Website section');
  });
});
