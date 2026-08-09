import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { captureScreenshot, downloadScreenshot, exportViewportScreenshot } from './screenshot';

describe('screenshot utility', () => {
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('returns an empty string when no canvas is available', () => {
    document.body.innerHTML = '<div></div>';
    expect(captureScreenshot(null)).toBe('');
  });

  it('captures a canvas to a PNG data URL', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const toDataURL = vi.fn().mockReturnValue('data:image/png;base64,MOCK');
    Object.defineProperty(canvas, 'toDataURL', { value: toDataURL });

    const result = captureScreenshot(canvas);

    expect(result).toBe('data:image/png;base64,MOCK');
    expect(toDataURL).toHaveBeenCalledWith('image/png', undefined);
  });

  it('supports WebP output with quality', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const toDataURL = vi.fn().mockReturnValue('data:image/webp;base64,MOCK');
    Object.defineProperty(canvas, 'toDataURL', { value: toDataURL });

    captureScreenshot(canvas, { mimeType: 'image/webp', quality: 0.8 });

    expect(toDataURL).toHaveBeenCalledWith('image/webp', 0.8);
  });

  it('downloads the screenshot', () => {
    const clickFn = vi.fn();
    const anchor = document.createElement('a');
    Object.defineProperty(anchor, 'click', { value: clickFn });
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(anchor);

    downloadScreenshot('data:image/png;base64,MOCK', 'test.png');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(anchor.href).toContain('data:image/png;base64,MOCK');
    expect(anchor.download).toBe('test.png');
    expect(clickFn).toHaveBeenCalled();

    createElementSpy.mockRestore();
  });

  it('exports the viewport screenshot', () => {
    const toDataURL = vi.fn().mockReturnValue('data:image/png;base64,MOCK');
    const canvas = document.createElement('canvas');
    canvas.className = 'viewport-canvas';
    Object.defineProperty(canvas, 'toDataURL', { value: toDataURL });

    const container = document.createElement('div');
    container.className = 'viewport';
    container.appendChild(canvas);
    document.body.appendChild(container);

    exportViewportScreenshot({ filename: 'giza.png' });

    expect(toDataURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    document.body.removeChild(container);
  });
});
