/**
 * Screenshot export utility for Research mode.
 *
 * Captures the current WebGL canvas as a PNG/WebP data URL and triggers a
 * browser download. The implementation is intentionally small and UI-only;
 * the scene track can later extend it with scale bars, north arrows, and
 * citation watermarks.
 */

export interface ScreenshotOptions {
  /** Output MIME type. Defaults to PNG. */
  mimeType?: 'image/png' | 'image/webp';
  /** Compression quality for WebP (0–1). Ignored for PNG. */
  quality?: number;
  /** Pixel ratio multiplier. Defaults to the device pixel ratio. */
  pixelRatio?: number;
  /** Download filename. Defaults to `giza-screenshot.png`. */
  filename?: string;
}

/**
 * Captures a canvas to a data URL.
 *
 * @param canvas The canvas to capture. If omitted, the first visible `<canvas>`
 *   in the document is used.
 * @param options Screenshot format options.
 * @returns The data URL, or an empty string if no canvas is available.
 */
export function captureScreenshot(
  canvas: HTMLCanvasElement | null | undefined,
  options: ScreenshotOptions = {},
): string {
  const target = canvas ?? document.querySelector<HTMLCanvasElement>('canvas') ?? null;
  if (!target) return '';

  const { mimeType = 'image/png', quality, pixelRatio = window.devicePixelRatio ?? 1 } = options;

  if (pixelRatio === 1) {
    return target.toDataURL(mimeType, quality);
  }

  const width = target.width;
  const height = target.height;

  const temp = document.createElement('canvas');
  temp.width = Math.max(1, Math.floor(width * pixelRatio));
  temp.height = Math.max(1, Math.floor(height * pixelRatio));
  const ctx = temp.getContext('2d');
  if (!ctx) return target.toDataURL(mimeType, quality);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(target, 0, 0, temp.width, temp.height);
  return temp.toDataURL(mimeType, quality);
}

/**
 * Triggers a browser download of the captured screenshot.
 *
 * @param dataUrl The image data URL.
 * @param filename The download filename.
 */
export function downloadScreenshot(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Convenience helper that captures the current viewport and downloads it.
 *
 * @param options Screenshot format options.
 */
export function exportViewportScreenshot(options: ScreenshotOptions = {}): string {
  const filename = options.filename ?? `giza-screenshot-${Date.now()}.png`;
  const canvas = document.querySelector<HTMLCanvasElement>('.viewport canvas');
  const dataUrl = captureScreenshot(canvas, options);
  if (dataUrl) downloadScreenshot(dataUrl, filename);
  return dataUrl;
}
