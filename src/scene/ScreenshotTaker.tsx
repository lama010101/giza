import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/store/app';
import { composeScreenshot, getCitationText } from './screenshot';
import type { ScreenshotFormat } from './screenshot';
import { version } from '../../package.json';

function downloadScreenshot(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function ScreenshotTaker(): null {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const screenshotRequest = useAppStore((state) => state.screenshotRequest);
  const clearScreenshotRequest = useAppStore((state) => state.clearScreenshotRequest);

  useEffect(() => {
    if (!screenshotRequest) return undefined;
    if (typeof gl.setDrawingBufferSize !== 'function' || typeof gl.getClearColor !== 'function') {
      clearScreenshotRequest();
      return undefined;
    }

    const store = useAppStore.getState();
    const {
      screenshotOptions,
      cameraTarget,
      activeMonument,
      selectedObjectId,
      selectedEvidenceId,
    } = store;
    const target = new THREE.Vector3(cameraTarget.x, cameraTarget.y, cameraTarget.z);
    const citation = getCitationText(activeMonument, selectedObjectId, selectedEvidenceId, version);

    document.body.classList.add('screenshot-mode');
    let cancelled = false;

    void composeScreenshot(gl, scene, camera, screenshotOptions, target, citation)
      .then((dataUrl) => {
        if (cancelled) return;
        const ext: ScreenshotFormat = screenshotOptions.format === 'webp' ? 'webp' : 'png';
        downloadScreenshot(dataUrl, `giza-screenshot-${screenshotRequest}.${ext}`);
      })
      .finally(() => {
        document.body.classList.remove('screenshot-mode');
        clearScreenshotRequest();
      });

    return () => {
      cancelled = true;
    };
  }, [screenshotRequest, gl, scene, camera, clearScreenshotRequest]);

  return null;
}
