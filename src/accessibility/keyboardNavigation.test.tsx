import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useKeyboardNavigation } from './keyboardNavigation';
import { useAccessibilityStore } from './accessibility';

function TestComponent({ actions }: { actions: Record<string, () => void> }): JSX.Element {
  useKeyboardNavigation(actions);
  return <div data-testid="keyboard-test">Keyboard test</div>;
}

describe('useKeyboardNavigation', () => {
  beforeEach(() => {
    useAccessibilityStore.getState().reset();
  });

  it('calls the mapped action when a registered shortcut is pressed', () => {
    const tabScene = vi.fn();
    render(<TestComponent actions={{ 'tab-scene': tabScene }} />);

    fireEvent.keyDown(window, { key: '1' });

    expect(tabScene).toHaveBeenCalledOnce();
  });

  it('does not call an action for unregistered keys', () => {
    const tabScene = vi.fn();
    render(<TestComponent actions={{ 'tab-scene': tabScene }} />);

    fireEvent.keyDown(window, { key: 'z' });

    expect(tabScene).not.toHaveBeenCalled();
  });

  it('stops intercepting when keyboard navigation is disabled', () => {
    const tabScene = vi.fn();
    render(<TestComponent actions={{ 'tab-scene': tabScene }} />);

    act(() => useAccessibilityStore.getState().setKeyboardNavEnabled(false));
    fireEvent.keyDown(window, { key: '1' });

    expect(tabScene).not.toHaveBeenCalled();
  });

  it('ignores shortcuts while the user is typing in an input', () => {
    const tabScene = vi.fn();
    const { container } = render(<TestComponent actions={{ 'tab-scene': tabScene }} />);
    const input = document.createElement('input');
    container.appendChild(input);
    input.focus();

    fireEvent.keyDown(input, { key: '1' });

    expect(tabScene).not.toHaveBeenCalled();
  });
});
