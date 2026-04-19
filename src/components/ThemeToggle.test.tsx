import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from './ThemeToggle';

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}));

import { useTheme } from 'next-themes';

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render theme toggle button', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      setTheme: vi.fn(),
    } as any);

    render(<ThemeToggle />);

    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
  });

  it('should show sun icon in light mode', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      setTheme: vi.fn(),
    } as any);

    render(<ThemeToggle />);

    const sunIcon = screen.getByRole('button').querySelector('svg:first-child');
    expect(sunIcon).toBeInTheDocument();
  });

  it('should show moon icon in dark mode', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: 'dark',
      setTheme: vi.fn(),
    } as any);

    render(<ThemeToggle />);

    const moonIcon = screen.getByRole('button').querySelector('svg:last-child');
    expect(moonIcon).toBeInTheDocument();
  });

  it('should toggle theme when clicked', async () => {
    const user = userEvent.setup();
    const setTheme = vi.fn();

    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      setTheme,
    } as any);

    render(<ThemeToggle />);

    const button = screen.getByRole('button', { name: /toggle theme/i });
    await user.click(button);

    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('should toggle from dark to light', async () => {
    const user = userEvent.setup();
    const setTheme = vi.fn();

    vi.mocked(useTheme).mockReturnValue({
      theme: 'dark',
      setTheme,
    } as any);

    render(<ThemeToggle />);

    const button = screen.getByRole('button', { name: /toggle theme/i });
    await user.click(button);

    expect(setTheme).toHaveBeenCalledWith('light');
  });
});
