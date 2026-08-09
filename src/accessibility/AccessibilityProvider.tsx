import { useEffect, type ReactNode } from 'react';
import { useAccessibilityStore, getColorblindFilter, HIGH_CONTRAST_COLORS } from './accessibility';

/**
 * AccessibilityProvider wires the accessibility store to the document:
 *  - high-contrast / reduced-motion / keyboard-nav / screen-reader classes
 *  - colorblind and high-contrast filters on #root
 *  - font-size multiplier on <html>
 *  - a single ARIA live region shared with useAnnouncer
 */
export function AccessibilityProvider({ children }: { children: ReactNode }): JSX.Element {
  const highContrast = useAccessibilityStore((s) => s.highContrast);
  const colorblindType = useAccessibilityStore((s) => s.colorblindType);
  const reducedMotion = useAccessibilityStore((s) => s.reducedMotion);
  const fontSizeMultiplier = useAccessibilityStore((s) => s.fontSizeMultiplier);
  const screenReaderEnabled = useAccessibilityStore((s) => s.screenReaderEnabled);
  const keyboardNavEnabled = useAccessibilityStore((s) => s.keyboardNavEnabled);
  const focusIndicator = useAccessibilityStore((s) => s.focusIndicator);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const appRoot = document.getElementById('root');

    body.classList.toggle('a11y-high-contrast', highContrast);
    body.classList.toggle('a11y-reduced-motion', reducedMotion);
    body.classList.toggle('a11y-keyboard-nav', keyboardNavEnabled);
    body.classList.toggle('a11y-screen-reader', screenReaderEnabled);
    body.classList.remove('a11y-focus-default', 'a11y-focus-enhanced', 'a11y-focus-minimal');
    body.classList.add(`a11y-focus-${focusIndicator}`);

    html.style.setProperty('--a11y-font-size-multiplier', String(fontSizeMultiplier));

    const filters: string[] = [];
    if (colorblindType !== 'none') filters.push(getColorblindFilter(colorblindType));
    if (highContrast) filters.push('contrast(1.4)');
    const filterValue = filters.join(' ') || 'none';
    html.style.setProperty('--a11y-filter', filterValue);
    if (appRoot) appRoot.style.filter = filterValue;

    if (highContrast) {
      Object.entries(HIGH_CONTRAST_COLORS).forEach(([key, value]) => {
        html.style.setProperty(`--a11y-${key}`, value);
      });
    } else {
      Object.keys(HIGH_CONTRAST_COLORS).forEach((key) => {
        html.style.removeProperty(`--a11y-${key}`);
      });
    }
  }, [
    highContrast,
    colorblindType,
    reducedMotion,
    fontSizeMultiplier,
    screenReaderEnabled,
    keyboardNavEnabled,
    focusIndicator,
  ]);

  return (
    <>
      <div id="aria-announcer" aria-live="polite" aria-atomic="true" className="sr-only" />
      {children}
    </>
  );
}
