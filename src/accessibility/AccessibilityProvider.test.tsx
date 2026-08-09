import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AccessibilityProvider } from './AccessibilityProvider';
import { useAccessibilityStore } from './accessibility';

describe('AccessibilityProvider', () => {
  beforeEach(() => {
    useAccessibilityStore.getState().reset();
    document.body.className = '';
    document.documentElement.removeAttribute('style');

    let appRoot = document.getElementById('root');
    if (!appRoot) {
      appRoot = document.createElement('div');
      appRoot.id = 'root';
      document.body.appendChild(appRoot);
    }
    appRoot.removeAttribute('style');
  });

  it('renders children and a single ARIA live region', () => {
    const { getByText, container } = render(
      <AccessibilityProvider>
        <div>app content</div>
      </AccessibilityProvider>,
    );

    expect(getByText('app content')).toBeInTheDocument();
    expect(container.querySelector('#aria-announcer')).toBeInTheDocument();
  });

  it('syncs high contrast to body classes and filter variables', () => {
    render(
      <AccessibilityProvider>
        <div />
      </AccessibilityProvider>,
    );

    act(() => useAccessibilityStore.getState().setHighContrast(true));

    expect(document.body.classList.contains('a11y-high-contrast')).toBe(true);
    expect(document.documentElement.style.getPropertyValue('--a11y-filter')).toContain(
      'contrast(1.4)',
    );
    expect(document.getElementById('root')?.style.filter).toContain('contrast(1.4)');
    expect(document.documentElement.style.getPropertyValue('--a11y-background')).toBe('#000000');
  });

  it('syncs colorblind filter to the root element', () => {
    render(
      <AccessibilityProvider>
        <div />
      </AccessibilityProvider>,
    );

    act(() => useAccessibilityStore.getState().setColorblindType('protanopia'));

    const filter = document.documentElement.style.getPropertyValue('--a11y-filter');
    expect(filter).toContain('saturate');
    expect(document.getElementById('root')?.style.filter).toBe(filter);
  });

  it('syncs reduced motion, font size, and focus indicator classes', () => {
    render(
      <AccessibilityProvider>
        <div />
      </AccessibilityProvider>,
    );

    act(() => useAccessibilityStore.getState().setReducedMotion(true));
    expect(document.body.classList.contains('a11y-reduced-motion')).toBe(true);

    act(() => useAccessibilityStore.getState().setFontSizeMultiplier(1.5));
    expect(document.documentElement.style.getPropertyValue('--a11y-font-size-multiplier')).toBe(
      '1.5',
    );

    act(() => useAccessibilityStore.getState().setFocusIndicator('enhanced'));
    expect(document.body.classList.contains('a11y-focus-enhanced')).toBe(true);
    expect(document.body.classList.contains('a11y-focus-default')).toBe(false);
  });

  it('syncs screen reader and keyboard navigation classes', () => {
    render(
      <AccessibilityProvider>
        <div />
      </AccessibilityProvider>,
    );

    act(() => useAccessibilityStore.getState().setScreenReaderEnabled(false));
    expect(document.body.classList.contains('a11y-screen-reader')).toBe(false);

    act(() => useAccessibilityStore.getState().setKeyboardNavEnabled(true));
    expect(document.body.classList.contains('a11y-keyboard-nav')).toBe(true);
  });
});
