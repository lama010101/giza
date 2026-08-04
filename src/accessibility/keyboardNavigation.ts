/**
 * Keyboard navigation hook per M12-T01.
 *
 * Provides:
 *   - Global keyboard shortcut handling
 *   - Focus management
 *   - Tab order management
 *   - Roving tabindex for composite widgets
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAccessibilityStore } from './accessibility';
import { KEYBOARD_SHORTCUTS } from './accessibility';

export interface KeyboardAction {
  action: string;
  handler: () => void;
}

/**
 * useKeyboardNavigation — registers global keyboard shortcuts.
 *
 * @param actions Map of action name to handler function
 */
export function useKeyboardNavigation(actions: Record<string, () => void>): void {
  const keyboardNavEnabled = useAccessibilityStore((s) => s.keyboardNavEnabled);

  useEffect(() => {
    if (!keyboardNavEnabled) return;

    const handler = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      for (const shortcut of KEYBOARD_SHORTCUTS) {
        if (e.key !== shortcut.key) continue;
        if (!!shortcut.ctrl !== e.ctrlKey) continue;
        if (!!shortcut.shift !== e.shiftKey) continue;
        if (!!shortcut.alt !== e.altKey) continue;

        const action = actions[shortcut.action];
        if (action) {
          e.preventDefault();
          action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [keyboardNavEnabled, actions]);
}

/**
 * useFocusManagement — manages focus for modal panels and dialogs.
 *
 * When a panel opens, focus moves to the panel.
 * When a panel closes, focus returns to the trigger element.
 */
export function useFocusManagement(isOpen: boolean) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Save current focus as trigger
      triggerRef.current = document.activeElement as HTMLElement;
      // Move focus to panel
      requestAnimationFrame(() => {
        const focusable = panelRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        focusable?.focus();
      });
    } else if (triggerRef.current) {
      // Return focus to trigger
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [isOpen]);

  return panelRef;
}

/**
 * useRovingTabindex — implements roving tabindex for composite widgets
 * (e.g., toolbar, radio group, menu).
 *
 * Only one element in the group has tabindex=0; others have tabindex=-1.
 * Arrow keys move the "roving" focus.
 */
export function useRovingTabindex(
  itemIds: string[],
  orientation: 'horizontal' | 'vertical' = 'horizontal',
): {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  handleKeyDown: (e: React.KeyboardEvent, index: number) => void;
  getTabindex: (index: number) => 0 | -1;
} {
  const [activeIndex, setActiveIndex] = useRovingTabindexState(itemIds.length);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const isHorizontal = orientation === 'horizontal';
      const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
      const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

      if (e.key === nextKey) {
        e.preventDefault();
        const next = (index + 1) % itemIds.length;
        setActiveIndex(next);
      } else if (e.key === prevKey) {
        e.preventDefault();
        const prev = (index - 1 + itemIds.length) % itemIds.length;
        setActiveIndex(prev);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setActiveIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setActiveIndex(itemIds.length - 1);
      }
    },
    [orientation, itemIds.length, setActiveIndex],
  );

  const getTabindex = useCallback(
    (index: number): 0 | -1 => (index === activeIndex ? 0 : -1),
    [activeIndex],
  );

  return { activeIndex, setActiveIndex, handleKeyDown, getTabindex };
}

// Internal state hook (separated for clarity)
import { useState, useCallback as useCb } from 'react';
function useRovingTabindexState(_length: number) {
  const [activeIndex, setActiveIndex] = useState(0);
  return [activeIndex, setActiveIndex] as const;
}

/**
 * useAnnouncer — provides ARIA live region announcements.
 *
 * Returns a function to announce messages to screen readers.
 */
export function useAnnouncer() {
  const enabled = useAccessibilityStore((s) => s.screenReaderEnabled);
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Create live region if it doesn't exist
    let region = document.getElementById('aria-announcer') as HTMLDivElement | null;
    if (!region) {
      region = document.createElement('div');
      region.id = 'aria-announcer';
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      region.style.position = 'absolute';
      region.style.width = '1px';
      region.style.height = '1px';
      region.style.overflow = 'hidden';
      region.style.clip = 'rect(0 0 0 0)';
      document.body.appendChild(region);
    }
    announcerRef.current = region;

    return () => {
      // Don't remove — it's shared
    };
  }, [enabled]);

  const announce = useCb(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      if (!enabled || !announcerRef.current) return;
      announcerRef.current.setAttribute('aria-live', priority);
      announcerRef.current.textContent = '';
      // Force re-announcement
      requestAnimationFrame(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message;
        }
      });
    },
    [enabled],
  );

  return announce;
}
