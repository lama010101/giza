import * as THREE from 'three';
import { getObjectById, getEvidenceById, getSourceById } from '@/evidence/repository';
import { COORDINATE_SYSTEM } from './coordinateSystem';

export type ScreenshotFormat = 'png' | 'webp';

export interface ScreenshotOptions {
  hideUi: boolean;
  transparentBg: boolean;
  highRes: boolean;
  orthographic: boolean;
  scaleBar: boolean;
  northArrow: boolean;
  citationWatermark: boolean;
  format: ScreenshotFormat;
}

export const DEFAULT_SCREENSHOT_OPTIONS: ScreenshotOptions = {
  hideUi: true,
  transparentBg: false,
  highRes: false,
  orthographic: false,
  scaleBar: true,
  northArrow: true,
  citationWatermark: true,
  format: 'png',
};

export const SCREENSHOT_FORMAT_MIME: Record<ScreenshotFormat, string> = {
  png: 'image/png',
  webp: 'image/webp',
};

export interface ScaleBarMetrics {
  widthPx: number;
  label: string;
  meters: number;
}

const WORLD_NORTH = new THREE.Vector3(
  COORDINATE_SYSTEM.northAxis.x,
  COORDINATE_SYSTEM.northAxis.y,
  COORDINATE_SYSTEM.northAxis.z,
);

export function formatLength(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1).replace(/\.0$/, '')} km`;
  if (meters >= 1) return `${Math.round(meters)} m`;
  if (meters >= 0.01) return `${(meters * 100).toFixed(0)} cm`;
  return `${(meters * 1000).toFixed(0)} mm`;
}

function roundToNice(value: number): number {
  if (value <= 0 || !Number.isFinite(value)) return 0;
  const exponent = Math.floor(Math.log10(value));
  const base = 10 ** exponent;
  const normalized = value / base;
  const factors = [1, 2, 5, 10];
  for (let i = factors.length - 1; i >= 0; i -= 1) {
    if (factors[i] <= normalized) {
      return factors[i] * base;
    }
  }
  return base;
}

export function getScaleBarMetrics(
  metersPerPixel: number,
  maxPixels = 120,
): ScaleBarMetrics | null {
  if (metersPerPixel <= 0 || !Number.isFinite(metersPerPixel)) return null;
  const rawMeters = metersPerPixel * maxPixels;
  const meters = roundToNice(rawMeters);
  const widthPx = meters / metersPerPixel;
  return { widthPx, label: formatLength(meters), meters };
}

export function getWorldHeightAtTarget(
  camera: THREE.Camera,
  target: THREE.Vector3,
  viewportHeight: number,
): number {
  if (viewportHeight <= 0) return 0;
  if ((camera as THREE.OrthographicCamera).isOrthographicCamera) {
    const ortho = camera as THREE.OrthographicCamera;
    return ortho.top - ortho.bottom;
  }
  const perspective = camera as THREE.PerspectiveCamera;
  if (!perspective.isPerspectiveCamera) return 0;
  const distance = camera.position.distanceTo(target);
  if (distance <= 0) return 0;
  const fovRad = THREE.MathUtils.degToRad(perspective.fov);
  return 2 * distance * Math.tan(fovRad / 2);
}

export function buildOrthographicCamera(
  original: THREE.Camera,
  target: THREE.Vector3,
  width: number,
  height: number,
): THREE.OrthographicCamera {
  let worldHeight = 100;
  if ((original as THREE.PerspectiveCamera).isPerspectiveCamera) {
    const perspective = original as THREE.PerspectiveCamera;
    const distance = original.position.distanceTo(target);
    const fovRad = THREE.MathUtils.degToRad(perspective.fov);
    worldHeight = 2 * distance * Math.tan(fovRad / 2);
  } else if ((original as THREE.OrthographicCamera).isOrthographicCamera) {
    const ortho = original as THREE.OrthographicCamera;
    worldHeight = ortho.top - ortho.bottom;
  }

  const aspect = width / height;
  const halfHeight = worldHeight / 2;
  const halfWidth = halfHeight * aspect;
  const near = (original as { near?: number }).near ?? 0.1;
  const far = (original as { far?: number }).far ?? 2000;

  const cam = new THREE.OrthographicCamera(
    -halfWidth,
    halfWidth,
    halfHeight,
    -halfHeight,
    near,
    far,
  );
  cam.position.copy(original.position);
  cam.quaternion.copy(original.quaternion);
  cam.up.copy(original.up);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  return cam;
}

export function getNorthAngle(camera: THREE.Camera): number {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);

  let right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
  if (right.lengthSq() < 1e-12) {
    right = new THREE.Vector3(
      COORDINATE_SYSTEM.eastAxis.x,
      COORDINATE_SYSTEM.eastAxis.y,
      COORDINATE_SYSTEM.eastAxis.z,
    );
  }

  const up = new THREE.Vector3().crossVectors(right, forward).normalize();
  const nx = WORLD_NORTH.dot(right);
  const ny = WORLD_NORTH.dot(up);
  return Math.atan2(-ny, nx);
}

export function getCitationText(
  activeMonument: string,
  selectedObjectId: string | null,
  selectedEvidenceId: string | null,
  version: string,
): string {
  const monumentLabel = activeMonument.replace(/-/g, ' ');
  const parts: string[] = [`GIZA v${version}`, monumentLabel];

  if (selectedObjectId) {
    const obj = getObjectById(selectedObjectId);
    if (obj) parts.push(obj.name);
  }

  if (selectedEvidenceId) {
    const ev = getEvidenceById(selectedEvidenceId);
    if (ev?.sourceIds.length) {
      const source = getSourceById(ev.sourceIds[0]);
      if (source) {
        const year = source.year ? ` (${source.year})` : '';
        parts.push(`Source: ${source.title}${year}`);
      }
    }
  }

  return parts.join(' | ');
}

function drawScaleBar(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  metrics: ScaleBarMetrics,
): void {
  const margin = 24;
  const y = height - margin;
  const x = margin;
  const barWidth = Math.min(metrics.widthPx, width - margin * 2);

  ctx.save();
  ctx.strokeStyle = '#e0e0e0';
  ctx.fillStyle = '#e0e0e0';
  ctx.lineWidth = 2;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + barWidth, y);
  ctx.moveTo(x, y - 4);
  ctx.lineTo(x, y + 4);
  ctx.moveTo(x + barWidth, y - 4);
  ctx.lineTo(x + barWidth, y + 4);
  ctx.stroke();

  ctx.fillText(metrics.label, x + barWidth / 2, y + 18);
  ctx.restore();
}

function drawNorthArrow(
  ctx: CanvasRenderingContext2D,
  width: number,
  _height: number,
  angle: number,
): void {
  const margin = 24;
  const arrowLength = 32;
  const x = width - margin - arrowLength;
  const y = margin + arrowLength;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = '#ef4444';
  ctx.fillStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(arrowLength, 0);
  ctx.moveTo(arrowLength, 0);
  ctx.lineTo(arrowLength - 7, -5);
  ctx.moveTo(arrowLength, 0);
  ctx.lineTo(arrowLength - 7, 5);
  ctx.stroke();

  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', arrowLength + 6, 0);
  ctx.restore();
}

function drawCitation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  citation: string,
): void {
  const margin = 24;
  const maxWidth = width * 0.5;

  ctx.save();
  ctx.fillStyle = '#e0e0e0';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;

  let text = citation;
  let textWidth = ctx.measureText(text).width;
  while (textWidth > maxWidth && text.length > 10) {
    text = `${text.slice(0, text.length - 4)}…`;
    textWidth = ctx.measureText(text).width;
  }
  ctx.fillText(text, width - margin, height - margin);
  ctx.restore();
}

export function drawScreenshotOverlays(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: ScreenshotOptions,
  overlays: {
    scaleBar?: ScaleBarMetrics | null;
    northAngle?: number;
    citation?: string;
  },
): void {
  ctx.save();
  if (options.scaleBar && overlays.scaleBar) {
    drawScaleBar(ctx, width, height, overlays.scaleBar);
  }
  if (options.northArrow && overlays.northAngle !== undefined) {
    drawNorthArrow(ctx, width, height, overlays.northAngle);
  }
  if (options.citationWatermark && overlays.citation) {
    drawCitation(ctx, width, height, overlays.citation);
  }
  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const cleanup = (): void => {
      img.onload = null;
      img.onerror = null;
    };

    img.onload = (): void => {
      cleanup();
      resolve(img);
    };
    img.onerror = (err): void => {
      cleanup();
      reject(err);
    };
    img.src = src;

    setTimeout(() => {
      cleanup();
      reject(new Error('image load timeout'));
    }, 5000);
  });
}

export async function composeScreenshot(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: ScreenshotOptions,
  target: THREE.Vector3,
  citation: string,
): Promise<string> {
  const originalBackground = scene.background;
  const originalClearColor = new THREE.Color();
  const originalClearAlpha = gl.getClearAlpha();
  gl.getClearColor(originalClearColor);

  const originalSize = new THREE.Vector2();
  gl.getSize(originalSize);
  const originalPixelRatio = gl.getPixelRatio();

  const scale = options.highRes ? 2 : 1;
  const logicalTargetWidth = Math.floor(originalSize.width * scale);
  const logicalTargetHeight = Math.floor(originalSize.height * scale);

  try {
    if (options.highRes) {
      gl.setDrawingBufferSize(logicalTargetWidth, logicalTargetHeight, originalPixelRatio);
    }

    const bufferSize = new THREE.Vector2();
    gl.getDrawingBufferSize(bufferSize);
    const targetWidth = bufferSize.width;
    const targetHeight = bufferSize.height;

    let screenshotCamera: THREE.Camera;
    if (options.orthographic) {
      screenshotCamera = buildOrthographicCamera(camera, target, targetWidth, targetHeight);
    } else {
      const clone = camera.clone() as THREE.PerspectiveCamera;
      if (clone.isPerspectiveCamera) {
        clone.aspect = targetWidth / targetHeight;
        clone.updateProjectionMatrix();
      }
      screenshotCamera = clone;
    }

    if (options.transparentBg) {
      scene.background = null;
      gl.setClearColor(new THREE.Color(0, 0, 0), 0);
      gl.setClearAlpha(0);
    }

    gl.render(scene, screenshotCamera);

    const mime = SCREENSHOT_FORMAT_MIME[options.format];
    const rawDataUrl = gl.domElement.toDataURL(mime);

    const output = document.createElement('canvas');
    output.width = targetWidth;
    output.height = targetHeight;
    const ctx = output.getContext('2d');
    if (!ctx) return rawDataUrl;

    let img: HTMLImageElement;
    try {
      img = await loadImage(rawDataUrl);
    } catch {
      return rawDataUrl;
    }

    ctx.drawImage(img, 0, 0);

    const worldHeight = getWorldHeightAtTarget(screenshotCamera, target, targetHeight);
    const metersPerPixel = worldHeight / targetHeight;
    const scaleBar = getScaleBarMetrics(metersPerPixel);
    const northAngle = getNorthAngle(screenshotCamera);

    drawScreenshotOverlays(ctx, targetWidth, targetHeight, options, {
      scaleBar,
      northAngle,
      citation,
    });

    return output.toDataURL(mime);
  } finally {
    scene.background = originalBackground;
    gl.setClearColor(originalClearColor, originalClearAlpha);
    gl.setClearAlpha(originalClearAlpha);
    gl.setDrawingBufferSize(originalSize.width, originalSize.height, originalPixelRatio);

    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const perspective = camera as THREE.PerspectiveCamera;
      perspective.aspect = originalSize.width / originalSize.height;
      perspective.updateProjectionMatrix();
    }
  }
}
